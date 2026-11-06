import type { z } from "zod";
import { catchGraphError, fail, hasErrors, type Issue, issue } from "#/issue.js";
import type { ThresholdOptions } from "#/locate.js";
import type { Graph, GraphDraft } from "#/model/graph.js";
import { AtomNode, isType, type Node, SchemeNode, typeArticles } from "#/model/node.js";
import { Participant } from "#/model/participant.js";
import { Edge } from "#/model/edge.js";
import { Resource } from "#/model/resource.js";
import {
  type CodecArgs,
  type ResolvedCodecs,
  resolveCodecs,
  type UserdataSchema,
} from "#/model/userdata.js";
import { linkText, resolveSchemeOf } from "#/patch/resolve.js";
import {
  type AtomPatch,
  type ParticipantPatch,
  type Patch,
  patchSchema,
  type ResourcePatch,
  type SchemePatch,
} from "#/patch/schema.js";

export interface PatchResult<S extends UserdataSchema> {
  /** The changed graph, or the input if there are errors. */
  readonly graph: Graph<S>;
  readonly issues: readonly Issue[];
  /** Ids of the nodes, resources, and participants that the patch created. */
  readonly created: readonly string[];
  /** Ids of the existing elements that the patch replaced. */
  readonly updated: readonly string[];
  /** Ids of the elements that were removed, including dangling schemes. */
  readonly removed: readonly string[];
}

type Path = NonNullable<Issue["path"]>;

class Editor<S extends UserdataSchema> {
  readonly issues: Issue[] = [];

  constructor(
    private readonly graph: GraphDraft<S>,
    private readonly codecs: ResolvedCodecs<S>,
    private readonly options: ThresholdOptions,
  ) {}

  apply(patch: z.output<typeof patchSchema>): void {
    const { graph } = this;

    const cleared = patch.clear ? Object.keys(graph.nodes) : [];

    // removals cascade, so ids that a cascade already removed are skipped
    this.attempt(["delete"], () => graph.removeElements([...cleared, ...patch.delete]));
    this.each("resources", patch.resources, (item) => this.resource(item));
    this.each("participants", patch.participants, (item) => this.participant(item));
    this.each("atoms", patch.atoms, (item, path) => this.atom(item, path));

    // all schemes exist before they are wired, so that schemes can target schemes
    const added = this.each("schemes", patch.schemes, (item, path) => this.scheme(item, path));
    patch.schemes.forEach((item, index) => {
      if (added[index]) {
        this.attempt(["schemes", index], () => this.wire(item));
      }
    });

    const { majorClaim } = patch;

    if (majorClaim !== null) {
      this.attempt(["majorClaim"], () => {
        graph.majorClaim = majorClaim;
      });
    }
  }

  /** Apply the action to each item, returns whether each one succeeded. */
  private each<T>(
    key: string,
    items: readonly T[],
    action: (item: T, path: Path) => void,
  ): boolean[] {
    return items.map((item, index) => {
      const path = [key, index];

      return this.attempt(path, () => action(item, path));
    });
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

  private resource(item: ResourcePatch): void {
    const { graph } = this;
    const fields = {
      text: item.text,
      title: item.title ?? undefined,
      source: item.source ?? undefined,
    };

    if (Object.hasOwn(graph.resources, item.id)) {
      this.issues.push(...graph.updateResource(item.id, fields, this.options));
    } else {
      graph.addResource(
        new Resource({ ...fields, id: item.id, userdata: this.codecs.resource.decode({}) }),
      );
    }
  }

  private participant(item: ParticipantPatch): void {
    const { graph } = this;

    if (!Object.hasOwn(graph.participants, item.id)) {
      graph.addParticipant(
        new Participant({ id: item.id, userdata: this.codecs.participant.decode({}) }),
      );
    }

    graph.updateParticipant(item.id, {
      name: item.name ?? undefined,
      username: item.username ?? undefined,
      email: item.email ?? undefined,
      url: item.url ?? undefined,
      location: item.location ?? undefined,
      description: item.description ?? undefined,
    });
  }

  private atom(item: AtomPatch, path: Path): void {
    const { id, text } = item;
    const atom = this.node(id, "atom");
    const resource = item.resource ?? undefined;
    let reference = atom?.reference;

    // an unchanged atom keeps its reference, which may have been chosen by hand
    if (
      atom === undefined ||
      atom.text !== text ||
      (resource !== undefined && resource !== atom.reference?.resource)
    ) {
      const link = linkText(this.graph.resources, id, text, resource, this.options);
      this.warn(path, link.warning);
      reference = link.reference;
    }

    const fields = { text, reference, participant: item.participant ?? undefined };

    if (atom === undefined) {
      this.graph.addNode(new AtomNode({ ...fields, id, userdata: this.codecs.atom.decode({}) }));
    } else {
      this.graph.updateAtom(atom, fields);
    }
  }

  /** Create or replace the scheme node, it is wired afterwards. */
  private scheme(item: SchemePatch, path: Path): void {
    const { id } = item;
    const { scheme, warning } = resolveSchemeOf(id, item.type, item.scheme ?? undefined);
    this.warn(path, warning);
    const node = this.node(id, "scheme");

    if (node === undefined) {
      this.graph.addNode(new SchemeNode({ id, scheme, userdata: this.codecs.scheme.decode({}) }));
    } else {
      this.graph.updateScheme(node, { scheme });
    }
  }

  /**
   * Replace the premises and the conclusion.
   * Premises are atoms, schemes targeting this scheme (e.g. undercutters) are kept.
   */
  private wire({ id, premises, conclusion }: SchemePatch): void {
    const { graph, codecs } = this;
    const link = (source: string, target: string) =>
      graph.addEdge(new Edge({ source, target, userdata: codecs.edge.decode({}) }));

    for (const premise of premises) {
      if (this.node(premise, "atom") === undefined) {
        fail("unknown-element", `Premise '${premise}' of scheme '${id}' does not exist.`, [
          id,
          premise,
        ]);
      }
    }

    if (!Object.hasOwn(graph.nodes, conclusion)) {
      fail("unknown-element", `Conclusion '${conclusion}' of scheme '${id}' does not exist.`, [
        id,
        conclusion,
      ]);
    }

    if (premises.includes(conclusion)) {
      fail("invalid-patch", `Scheme '${id}' uses its conclusion '${conclusion}' as premise.`, [
        id,
        conclusion,
      ]);
    }

    graph
      .incomingEdges(id)
      .filter((edge) => graph.nodes[edge.source].type === "atom")
      .forEach((edge) => graph.removeEdge(edge));
    graph.outgoingEdges(id).forEach((edge) => graph.removeEdge(edge));
    premises.forEach((premise) => link(premise, id));
    link(id, conclusion);
  }
}

/**
 * Apply a patch to a graph, all or nothing.
 *
 * The patch is validated against `patchSchema`, problems are `invalid-patch` errors.
 * Returns the changed graph, which shares unchanged elements with the input.
 * If an issue is an error, the input graph is returned together with all issues.
 * Texts of atoms are linked to the most similar spans of the resources.
 */
export function applyPatch<S extends UserdataSchema>(
  graph: Graph<S>,
  patch: Patch,
  ...[options]: CodecArgs<S, ThresholdOptions>
): PatchResult<S> {
  const failed = (issues: readonly Issue[]): PatchResult<S> => ({
    graph,
    issues,
    created: [],
    updated: [],
    removed: [],
  });
  const validation = patchSchema.safeParse(patch);

  if (!validation.success) {
    return failed(
      validation.error.issues.map(({ message, path }) => ({
        ...issue("invalid-patch", message),
        path: path.map((key) => (typeof key === "number" ? key : String(key))),
      })),
    );
  }

  const parsed = validation.data;

  const draft = graph.draft();
  const editor = new Editor<S>(draft, resolveCodecs(options?.codecs), {
    threshold: options?.threshold,
  });
  editor.apply(parsed);
  const { issues } = editor;

  if (hasErrors(issues)) {
    return failed(issues);
  }

  const result = draft.freeze();
  const created: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];

  for (const [before, after, items] of [
    [graph.atomNodes, result.atomNodes, parsed.atoms],
    [graph.schemeNodes, result.schemeNodes, parsed.schemes],
    [graph.resources, result.resources, parsed.resources],
    [graph.participants, result.participants, parsed.participants],
  ] as const) {
    const submitted = new Set(items.map(({ id }) => id));

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

  return { graph: result, issues, created, updated, removed };
}
