import { catchGraphError, fail, hasErrors, type Issue } from "#/issue.js";
import type { ThresholdOptions } from "#/locate.js";
import { Edge } from "#/model/edge.js";
import type { Graph } from "#/model/graph.js";
import { AtomNode, isType, type Node, SchemeNode, typeArticles } from "#/model/node.js";
import { Participant } from "#/model/participant.js";
import type { Reference } from "#/model/reference.js";
import { Resource } from "#/model/resource.js";
import type { Scheme, SchemeType } from "#/model/scheme.js";
import {
  type CodecArgs,
  type ResolvedCodecs,
  resolveCodecs,
  type UserdataSchema,
} from "#/model/userdata.js";
import { elementIds, premiseIds } from "#/patch/ids.js";
import { linkText, resolveSchemeOf } from "#/patch/resolve.js";
import {
  type AtomPatch,
  type ParticipantPatch,
  type Patch,
  type Path,
  participantFields,
  type ResourcePatch,
  type SchemePatch,
} from "#/patch/schema.js";

export interface PatchResult<S extends UserdataSchema> {
  /** The changed graph, or the input if there are errors. */
  readonly graph: Graph<S>;
  readonly issues: readonly Issue[];
  /** Ids of the nodes, resources, and participants that the patch created. */
  readonly created: readonly string[];
  /** Ids of the existing elements that items of the patch changed. */
  readonly updated: readonly string[];
  /** Ids of the elements that were removed, including dangling schemes. */
  readonly removed: readonly string[];
}


/** The patched value of an optional field, `undefined` keeps it and `null` clears it. */
function patched(value: string | null | undefined, current: string | undefined): string | undefined {
  return value === undefined ? current : (value ?? undefined);
}


class Editor<S extends UserdataSchema> {
  readonly issues: Issue[] = [];
  // removals cascade, so ids of the input may already be gone when they are removed
  private readonly initial: ReadonlySet<string>;

  constructor(
    private readonly graph: Graph<S>,
    private readonly codecs: ResolvedCodecs<S>,
    private readonly options: ThresholdOptions,
  ) {
    this.initial = new Set(elementIds(graph));
  }

  apply(patch: Patch): void {
    const { graph } = this;

    if (patch.clear) {
      graph.removeElements(Object.keys(graph.nodes));
    }

    if (patch.remove !== undefined) {
      this.remove(patch.remove);
    }

    patch.resources?.forEach((item, index) =>
      this.attempt(["resources", index], () => this.resource(item)),
    );
    patch.participants?.forEach((item, index) =>
      this.attempt(["participants", index], () => this.participant(item)),
    );
    patch.atoms?.forEach((item, index) =>
      this.attempt(["atoms", index], () => this.atom(item, ["atoms", index])),
    );

    // all schemes exist before they are wired, so that schemes can target schemes
    const schemes = patch.schemes ?? [];
    const created = schemes.map((item, index) =>
      this.attempt(["schemes", index], () => this.scheme(item, ["schemes", index])),
    );
    schemes.forEach((item, index) => {
      if (created[index]) {
        this.attempt(["schemes", index], () => this.wire(item));
      }
    });

    if (patch.majorClaim !== undefined) {
      this.attempt(["majorClaim"], () => {
        graph.majorClaim = patch.majorClaim ?? undefined;
      });
    }
  }

  /** Run the action and record its `GraphError`, returns whether it succeeded. */
  private attempt(path: Path, action: () => void): boolean {
    const error = catchGraphError(action);

    if (error !== undefined) {
      this.issues.push({ ...error, path });
    }

    return error === undefined;
  }

  private warn(path: Path, warning: Issue | undefined): void {
    if (warning !== undefined) {
      this.issues.push({ ...warning, path });
    }
  }

  /** The node with the id if it has the given type. */
  private node<T extends Node<S>["type"]>(
    id: string,
    type: T,
  ): Extract<Node<S>, { type: T }> | undefined {
    if (!Object.hasOwn(this.graph.nodes, id)) {
      return undefined;
    }

    const node = this.graph.nodes[id];

    if (!isType(node, type)) {
      fail(
        "invalid-patch",
        `Node '${id}' is ${typeArticles[node.type]}, not ${typeArticles[type]}.`,
        [id],
      );
    }

    return node;
  }

  /** Remove the elements at once, ids of the input that a cascade already removed are skipped. */
  private remove(ids: readonly string[]): void {
    const current = new Set(elementIds(this.graph));
    const unknown = ids.filter((id, index) => {
      const missing = !current.has(id) && !this.initial.has(id);

      if (missing) {
        this.attempt(["remove", index], () =>
          fail("unknown-element", `Element '${id}' does not exist.`, [id]),
        );
      }

      return missing;
    });

    if (unknown.length === 0) {
      this.attempt(["remove"], () =>
        this.graph.removeElements(ids.filter((id) => current.has(id))),
      );
    }
  }

  private resource(item: ResourcePatch): void {
    const { graph, codecs } = this;

    if (!Object.hasOwn(graph.resources, item.id)) {
      if (item.text === undefined) {
        fail("invalid-patch", `The new resource '${item.id}' needs a text.`, [item.id]);
      }

      graph.addResource(
        new Resource({
          id: item.id,
          text: item.text,
          title: item.title ?? undefined,
          source: item.source ?? undefined,
          userdata: codecs.resource.decode({}),
        }),
      );

      return;
    }

    const resource = graph.resources[item.id];
    this.issues.push(
      ...graph.updateResource(
        resource,
        {
          text: item.text ?? resource.text,
          title: patched(item.title, resource.title),
          source: patched(item.source, resource.source),
        },
        this.options,
      ),
    );
  }

  private participant(item: ParticipantPatch): void {
    const { graph, codecs } = this;
    const current = Object.hasOwn(graph.participants, item.id)
      ? graph.participants[item.id]
      : undefined;
    const fields = Object.fromEntries(
      participantFields.map((key) => [key, patched(item[key], current?.[key])]),
    );

    if (current === undefined) {
      graph.addParticipant(
        new Participant({ ...fields, id: item.id, userdata: codecs.participant.decode({}) }),
      );
    } else {
      graph.updateParticipant(current, fields);
    }
  }

  private atom(item: AtomPatch, path: Path): void {
    const { graph, codecs } = this;
    const { id, participant } = item;
    const atom = this.node(id, "atom");

    if (atom === undefined) {
      if (item.text === undefined) {
        fail("invalid-patch", `The new atom '${id}' needs a text.`, [id]);
      }

      graph.addNode(
        new AtomNode({
          id,
          text: item.text,
          participant: participant ?? undefined,
          reference: this.reference(path, id, item.text, item.resource),
          userdata: codecs.atom.decode({}),
        }),
      );

      return;
    }

    const text = item.text ?? atom.text;
    graph.updateAtom(atom, {
      text,
      participant: patched(participant, atom.participant),
      reference:
        item.text === undefined && item.resource === undefined
          ? atom.reference
          : this.reference(
              path,
              id,
              text,
              item.resource === undefined ? atom.reference?.resource : item.resource,
            ),
    });
  }

  /** Link the text, reporting why it is not linked or only to a similar span. */
  private reference(
    path: Path,
    id: string,
    text: string,
    resource: string | null | undefined,
  ): Reference | undefined {
    const { reference, warning } = linkText(this.graph.resources, id, text, resource, this.options);
    this.warn(path, warning);

    return reference;
  }

  private schemeOf(item: SchemePatch, current: SchemeType | undefined, path: Path): Scheme {
    const { scheme, warning } = resolveSchemeOf(item, current);
    this.warn(path, warning);

    return scheme;
  }

  /** Create or retype the scheme node, it is wired afterwards. */
  private scheme(item: SchemePatch, path: Path): void {
    const { graph, codecs } = this;
    const { id } = item;
    const scheme = this.node(id, "scheme");

    if (scheme === undefined) {
      if (item.premises === undefined || item.conclusion === undefined) {
        fail("invalid-patch", `The new scheme '${id}' needs premises and a conclusion.`, [id]);
      }

      graph.addNode(
        new SchemeNode({
          id,
          scheme: this.schemeOf(item, undefined, path),
          userdata: codecs.scheme.decode({}),
        }),
      );
    } else if (item.type !== undefined || item.scheme !== undefined) {
      graph.updateScheme(scheme, { scheme: this.schemeOf(item, scheme.scheme.case, path) });
    }
  }

  /**
   * Replace the premises and the conclusion that the item specifies.
   * Premises are atoms, schemes targeting this scheme (e.g. undercutters) are kept.
   */
  private wire({ id, premises, conclusion }: SchemePatch): void {
    const { graph, codecs } = this;
    const link = (source: string, target: string) =>
      graph.addEdge(new Edge({ source, target, userdata: codecs.edge.decode({}) }));
    const sources = premises ?? premiseIds(graph, id);

    if (premises?.length === 0) {
      fail("invalid-patch", `Scheme '${id}' needs at least one premise.`, [id]);
    }

    for (const premise of premises ?? []) {
      if (this.node(premise, "atom") === undefined) {
        fail("unknown-element", `Premise '${premise}' of scheme '${id}' does not exist.`, [id, premise]);
      }
    }

    if (conclusion !== undefined && !Object.hasOwn(graph.nodes, conclusion)) {
      fail("unknown-element", `Conclusion '${conclusion}' of scheme '${id}' does not exist.`, [
        id,
        conclusion,
      ]);
    }

    if (conclusion !== undefined && sources.includes(conclusion)) {
      fail("invalid-patch", `Scheme '${id}' uses its conclusion '${conclusion}' as premise.`, [
        id,
        conclusion,
      ]);
    }

    if (premises !== undefined) {
      graph
        .incomingEdges(id)
        .filter((edge) => graph.nodes[edge.source].type === "atom")
        .forEach((edge) => graph.removeEdge(edge));
      premises.forEach((premise) => link(premise, id));
    }

    if (conclusion !== undefined) {
      graph.outgoingEdges(id).forEach((edge) => graph.removeEdge(edge));
      link(id, conclusion);
    }
  }
}

/**
 * Apply a patch to a graph, all or nothing.
 *
 * Returns a copy of the graph (see `Graph.copy`) that shares unchanged elements with the input,
 * which is not modified.
 * If an issue is an error, the input graph is returned together with all issues.
 * Texts of atoms are linked to the most similar spans of the resources.
 */
export function applyPatch<S extends UserdataSchema>(
  graph: Graph<S>,
  patch: Patch,
  ...[options]: CodecArgs<S, ThresholdOptions>
): PatchResult<S> {
  const result = graph.copy();
  const editor = new Editor<S>(result, resolveCodecs(options?.codecs), {
    threshold: options?.threshold,
  });
  editor.apply(patch);
  const { issues } = editor;

  if (hasErrors(issues)) {
    return { graph, issues, created: [], updated: [], removed: [] };
  }

  const created: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];

  for (const [before, after, items] of [
    [graph.atomNodes, result.atomNodes, patch.atoms],
    [graph.schemeNodes, result.schemeNodes, patch.schemes],
    [graph.resources, result.resources, patch.resources],
    [graph.participants, result.participants, patch.participants],
  ] as const) {
    const submitted = new Set(items?.map(({ id }) => id));

    for (const id of Object.keys(after)) {
      if (!Object.hasOwn(before, id)) {
        created.push(id);
      } else if (submitted.has(id)) {
        updated.push(id);
      }
    }

    for (const id of Object.keys(before)) {
      if (!Object.hasOwn(after, id)) {
        removed.push(id);
      }
    }
  }

  return {
    graph: result,
    issues,
    created,
    updated,
    removed,
  };
}

