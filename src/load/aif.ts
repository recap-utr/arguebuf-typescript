import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { defaultScheme, isAifSchemeType } from "#/model/scheme.js";
import * as aifSchema from "#/schemas/aif.js";
import type { ResolvedCodecs, UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";

/**
 * Load a graph from the AIF format.
 *
 * Dialog nodes (L, TA, YA) are skipped silently, nodes of unknown types with a warning.
 * All listed participants and the speakers of locutions become participants.
 * An atom asserted by locutions gets their speaker as participant if they share exactly one,
 * and the locution text as reference if there is exactly one.
 * Numeric ids are stringified.
 * Throws an `invalid-input` error for structurally invalid input.
 * See `AifOptions.reconstructDialog` to keep the atoms that dialog nodes connect.
 */
export function aif<S extends UserdataSchema = {}>(
  obj: aifSchema.Graph,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): model.Graph<S> {
  return buildAif<S>(helpers.parseInput("AIF", aifSchema.Graph, obj), ...args);
}

/** Build a graph from AIF data that is already validated, e.g. the `AIF` object of xAIF. */
export function buildAif<S extends UserdataSchema = {}>(
  input: aifSchema.GraphOutput,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): model.Graph<S> {
  const ctx = helpers.loadOptions<S>(...args);
  const { name, codecs } = ctx;
  const graph = new model.GraphDraft<S>({ name, userdata: codecs.graph.decode({}) });
  const index = new Index(input);

  for (const participant of input.participants) {
    graph.addParticipant(
      helpers.newParticipant(
        codecs,
        participant.participantID,
        participant.firstname,
        participant.surname,
      ),
    );
  }

  const locutionSpeakers = input.locutions.map((locution) => ({
    node: locution.nodeID,
    person: locution.personID,
  }));

  for (const { person } of locutionSpeakers) {
    if (!Object.hasOwn(graph.participants, person)) {
      graph.addParticipant(helpers.newParticipant(codecs, person));
    }
  }

  // a locution may have several speakers
  const speakers = Map.groupBy(locutionSpeakers, ({ node }) => node);

  // edges of skipped nodes are expected to be missing, unlike dangling ones
  const skipped = new Set<string>();

  for (const aifNode of input.nodes) {
    let node = nodeFromAif(aifNode, codecs);

    if (node === undefined) {
      skipped.add(aifNode.nodeID);

      if (!aifSchema.dialogTypes.has(aifNode.type)) {
        ctx.report(
          "unknown-element",
          `Skipping node '${aifNode.nodeID}' of unknown type '${aifNode.type}'.`,
          [aifNode.nodeID],
        );
      }
    }

    if (node?.type === "atom") {
      const locutions = new Set(index.locutions(node.id));
      const persons = new Set(
        locutions
          .values()
          .flatMap((locution) => speakers.get(locution) ?? [])
          .map(({ person }) => person),
      );
      const [locution] = locutions;
      const [person] = persons;
      const text = locutions.size === 1 ? index.nodes.get(locution)?.text : undefined;

      node = node.with({
        participant: persons.size === 1 ? person : undefined,
        reference: text === undefined ? undefined : new model.Reference({ text }),
      });
    }

    if (node !== undefined) {
      helpers.addNode(graph, ctx, node);
    }
  }

  for (const [id, source, target] of index.edges) {
    helpers.addEdge(graph, ctx, { id, source, target }, skipped);
  }

  if (args[0]?.reconstructDialog) {
    reconstructDialog(graph, ctx, index);
  }

  return graph.freeze();
}

/** Create an atom or scheme node from an AIF node, undefined for dialog nodes and unknown types. */
function nodeFromAif<S extends UserdataSchema>(
  obj: aifSchema.NodeOutput,
  codecs: ResolvedCodecs<S>,
): model.Node<S> | undefined {
  if (obj.type !== "I" && !isAifSchemeType(obj.type)) {
    return undefined;
  }

  const id = obj.nodeID;
  const metadata = new model.Metadata({ created: date.parseAif(obj.timestamp) });

  if (obj.type === "I") {
    return new model.AtomNode({
      id,
      text: obj.text,
      metadata,
      userdata: codecs.atom.decode({}),
    });
  }

  return new model.SchemeNode({
    id,
    // a missing or empty scheme name falls back to the text
    scheme: model.resolveAifScheme(obj.type, obj.scheme || obj.text),
    metadata,
    userdata: codecs.scheme.decode({}),
  });
}

// id, source, and target
type Edge = readonly [string, string, string];

/** Nodes and edges of an AIF graph with string ids. */
class Index {
  readonly nodes: ReadonlyMap<string, aifSchema.NodeOutput>;
  readonly edges: readonly Edge[];
  readonly successors: ReadonlyMap<string, readonly Edge[]>;
  readonly predecessors: ReadonlyMap<string, readonly Edge[]>;

  constructor(obj: aifSchema.GraphOutput) {
    this.nodes = new Map(obj.nodes.map((node) => [node.nodeID, node]));
    this.edges = obj.edges.map((edge): Edge => [edge.edgeID, edge.fromID, edge.toID]);

    this.successors = Map.groupBy(this.edges, ([, source]) => source);
    this.predecessors = Map.groupBy(this.edges, ([, , target]) => target);
  }

  type(id: string): string | undefined {
    return this.nodes.get(id)?.type;
  }

  /** Neighbors of the given type in the direction of the edges. */
  follow(ids: readonly string[], forward: boolean, type: aifSchema.NodeType): string[] {
    const adjacency = forward ? this.successors : this.predecessors;

    return ids.flatMap((id) =>
      (adjacency.get(id) ?? [])
        .map(([, source, target]) => (forward ? target : source))
        .filter((neighbor) => this.type(neighbor) === type),
    );
  }

  /** Locutions asserting an atom via illocutions. */
  locutions(atomId: string): string[] {
    return this.follow(this.follow([atomId], false, "YA"), false, "L");
  }
}

/**
 * Connect isolated atoms to the atoms of adjacent turns via rephrase nodes.
 *
 * In AIF+, a locution (L) asserts an atom (I) via an illocution (YA)
 * and is linked to the locutions before and after it via transitions (TA).
 */
function reconstructDialog<S extends UserdataSchema>(
  graph: model.GraphDraft<S>,
  ctx: helpers.Context<S>,
  index: Index,
): void {
  const isolated = Object.values(graph.nodes).filter(
    (node) =>
      node.type === "atom" &&
      graph.incomingEdges(node).length === 0 &&
      graph.outgoingEdges(node).length === 0,
  );
  // connected pairs regardless of their order
  const pairs = new Set<string>();

  for (const atom of isolated) {
    const locutions = index.locutions(atom.id);

    // turns before (backward) and after (forward) the locutions
    for (const forward of [false, true]) {
      const transitions = index.follow(locutions, forward, "TA");
      const turns = index.follow(transitions, forward, "L");
      const illocutions = index.follow(turns, true, "YA");

      for (const target of index.follow(illocutions, true, "I")) {
        const pair = JSON.stringify([atom.id, target].sort());

        if (target !== atom.id && !pairs.has(pair)) {
          pairs.add(pair);
          const scheme = new model.SchemeNode({
            scheme: defaultScheme("rephrase"),
            userdata: ctx.codecs.scheme.decode({}),
          });
          graph.addNode(scheme);
          helpers.connect(graph, ctx, [atom.id], scheme.id, target);
        }
      }
    }
  }
}
