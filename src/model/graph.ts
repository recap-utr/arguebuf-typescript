import { fail, GraphError, type Issue } from "#/issue.js";
import type { ThresholdOptions } from "#/locate.js";
import type { AnalystChanges, AnalystOf } from "#/model/analyst.js";
import { Edge, type EdgeChanges, type EdgeOf } from "#/model/edge.js";
import {
  assertVacant,
  dropUnused,
  idOf,
  insert,
  lookup,
  remove,
  touched,
} from "#/model/graph/helpers.js";
import type { AtomRelation, SiblingOptions } from "#/model/graph/queries.js";
import { relocateReferences, type RelocateOptions } from "#/model/graph/references.js";
import { removeBranches, removeElements, removeNode } from "#/model/graph/removal.js";
import { validateAtom, validateEdge } from "#/model/graph/validation.js";
import { freeze } from "#/model/freeze.js";
import { GraphStore } from "#/model/graph/store.js";
import { GraphView } from "#/model/graph/view.js";
import { Metadata } from "#/model/metadata.js";
import {
  type AtomChanges,
  type AtomNodeOf,
  type Node,
  type SchemeChanges,
  SchemeNode,
  type SchemeNodeOf,
} from "#/model/node.js";
import type { ParticipantChanges, ParticipantOf } from "#/model/participant.js";
import { Reference } from "#/model/reference.js";
import type { Scheme } from "#/model/scheme.js";
import type { ResourceChanges, ResourceOf } from "#/model/resource.js";
import {
  type OptionalInit,
  initUserdata,
  type Userdata,
  type UserdataFactories,
  type UserdataInit,
  type UserdataSchema,
} from "#/model/userdata.js";

export { type Annotation, GraphView } from "#/model/graph/view.js";
export type { AtomRelation, RelocateOptions, SiblingOptions };

const defaultUserdata = <T>(): T => initUserdata<T>(undefined);

/** Options of `GraphDraft.connect`, `edgeUserdata` is required if the edge userdata is customized. */
export type ConnectOptions<S extends UserdataSchema> = UserdataFactories<S, "edge">;

/** Arguments of `GraphDraft.connect` after the nodes. */
export type ConnectArgs<S extends UserdataSchema> = OptionalInit<ConnectOptions<S>>;

/**
 * Options of `GraphDraft.link`.
 * `scheme` is the scheme of the inserted scheme node, the userdata factories are required
 * if the userdata of edges or schemes is customized.
 */
export type LinkOptions<S extends UserdataSchema> = {
  readonly scheme?: Scheme;
} & UserdataFactories<S, "edge" | "scheme">;

/** Arguments of `GraphDraft.link` after the nodes. */
export type LinkArgs<S extends UserdataSchema> = OptionalInit<LinkOptions<S>>;

export type GraphInit<S extends UserdataSchema = {}> = {
  name?: string;
  nodes?: Iterable<Node<S>>;
  edges?: Iterable<EdgeOf<S>>;
  resources?: Iterable<ResourceOf<S>>;
  participants?: Iterable<ParticipantOf<S>>;
  analysts?: Iterable<AnalystOf<S>>;
  majorClaim?: string;
  metadata?: Metadata;
} & UserdataInit<Userdata<S, "graph">>;

/** Init of a graph or draft, or the graph or draft to copy, which shares its elements. */
export type GraphSource<S extends UserdataSchema = {}> =
  | OptionalInit<GraphInit<S>>
  | [source: GraphView<S>];

/**
 * Immutable argument graph consisting of atom nodes, scheme nodes, and edges.
 *
 * The graph, its elements, and their plain userdata are frozen,
 * so it can be shared freely, e.g. in an undo history.
 * Changes are made on a `GraphDraft`, either within `edit` or via `draft` and `GraphDraft.freeze`.
 * Both share the unchanged elements, so this takes time proportional to the changes.
 * Adjacency queries take time proportional to the degree of the node.
 */
export class Graph<S extends UserdataSchema = {}> extends GraphView<S> {
  readonly name?: string;
  readonly metadata: Metadata;
  readonly userdata: Userdata<S, "graph">;

  constructor(...args: GraphSource<S>) {
    const [source] = args;
    const view = source instanceof GraphView ? source : new GraphDraft<S>(...args);
    super(GraphView.fork(view));
    this.name = view.name;
    this.metadata = view.metadata;
    this.userdata = freeze(view.userdata);
    Object.freeze(this.store);
    Object.freeze(this);
  }

  /** A draft to change a copy of the graph, see `GraphDraft.freeze`. */
  draft(): GraphDraft<S> {
    return new GraphDraft<S>(this);
  }

  /**
   * The graph changed by `recipe` on a draft, like `produce` of immer.
   * If `recipe` throws, nothing is changed.
   */
  edit(recipe: (draft: GraphDraft<S>) => void): Graph<S> {
    const draft = this.draft();
    recipe(draft);

    return draft.freeze();
  }
}

/**
 * Mutable copy of an argument graph, see `Graph.draft`.
 *
 * Elements are immutable, they are added, updated, and removed through the methods of the draft,
 * which validate references and cascade removals.
 * Violations throw a `GraphError` whose `issue` describes the cause.
 */
export class GraphDraft<S extends UserdataSchema = {}> extends GraphView<S> {
  name?: string;
  metadata: Metadata;
  userdata: Userdata<S, "graph">;

  constructor(...[source]: GraphSource<S>) {
    super(source instanceof GraphView ? GraphView.fork(source) : new GraphStore<S>());

    if (source instanceof GraphView) {
      this.name = source.name;
      this.metadata = source.metadata;
      this.userdata = source.userdata;

      return;
    }

    this.name = source?.name;
    this.metadata = source?.metadata ?? new Metadata();
    this.userdata = initUserdata<Userdata<S, "graph">>(source);

    for (const resource of source?.resources ?? []) {
      this.addResource(resource);
    }

    for (const participant of source?.participants ?? []) {
      this.addParticipant(participant);
    }

    for (const analyst of source?.analysts ?? []) {
      this.addAnalyst(analyst);
    }

    for (const node of source?.nodes ?? []) {
      this.addNode(node);
    }

    for (const edge of source?.edges ?? []) {
      this.addEdge(edge);
    }

    this.majorClaim = source?.majorClaim;
  }

  /**
   * The graph with the changes so far, the draft stays usable.
   * Takes time proportional to the changes since the last call.
   */
  freeze(): Graph<S> {
    return new Graph<S>(this);
  }

  override get majorClaim(): string | undefined {
    return this.store.majorClaim;
  }

  /** The major claim must be an atom node of this graph. */
  override set majorClaim(value: string | AtomNodeOf<S> | undefined) {
    if (value !== undefined) {
      const node = this.node(value);

      if (node.type !== "atom") {
        fail(
          "invalid-major-claim",
          `Only atom nodes can be the major claim, '${node.id}' is a scheme node.`,
          [node.id],
        );
      }
    }

    this.store.majorClaim = value === undefined ? undefined : idOf(value);
  }

  /** Add a node whose participant and resource are already part of the graph. */
  addNode(node: Node<S>): void {
    if (node.type === "atom") {
      validateAtom(this.store, node);
    }

    this.store.insertNode(node);
  }

  /**
   * Change fields of an atom node, keeping its edges, its participant and resource must exist.
   * Like all updates, `metadata.updated` is set to now unless the metadata is given.
   */
  updateAtom(node: string | AtomNodeOf<S>, changes: AtomChanges<Userdata<S, "atom">>): void {
    const current = this.typedNode(node, "atom");
    const updated = current.with(touched(current, changes));
    validateAtom(this.store, updated);
    this.store.writable("nodes")[updated.id] = updated;
  }

  /** Change fields of a scheme node, keeping its edges. */
  updateScheme(
    node: string | SchemeNodeOf<S>,
    changes: SchemeChanges<Userdata<S, "scheme">>,
  ): void {
    const current = this.typedNode(node, "scheme");
    this.store.writable("nodes")[current.id] = current.with(touched(current, changes));
  }

  /**
   * Remove a node together with its edges and all references to it.
   * Scheme nodes left without a premise or without a conclusion are removed as well,
   * which includes the scheme nodes depending on them (e.g. undercutters).
   * Returns the ids of all removed nodes and edges.
   */
  removeNode(node: string | Node<S>): string[] {
    return removeNode(this, this.store, this.node(node));
  }

  /**
   * Remove elements of any kind (nodes, edges, resources, participants) by id at once.
   * All ids must exist, otherwise nothing is removed.
   * Elements that a removal cascades to may be listed as well.
   * Returns the ids of all removed elements, including those of the cascades.
   */
  removeElements(ids: Iterable<string>): string[] {
    return removeElements(this, this.store, ids);
  }

  /**
   * Add an edge whose source and target are already part of the graph.
   * Self-loops, edges between two atoms, and parallel edges are rejected.
   */
  addEdge(edge: EdgeOf<S>): void {
    assertVacant(this.store.edges, edge, "Edge");
    validateEdge(this.store, edge);
    this.store.insertEdge(edge);
  }

  /** Change the metadata or userdata of an edge, its nodes are fixed. */
  updateEdge(edge: string | EdgeOf<S>, changes: EdgeChanges<Userdata<S, "edge">>): void {
    const current = lookup(this.store.edges, edge, "Edge");
    this.store.writable("edges")[current.id] = current.with(touched(current, changes));
  }

  /** Remove an edge and return its id. */
  removeEdge(edge: string | EdgeOf<S>): string[] {
    const { id } = lookup(this.store.edges, edge, "Edge");
    this.store.deleteEdge(this.store.edges[id]);

    return [id];
  }

  addResource(resource: ResourceOf<S>): void {
    insert(this.store.writable("resources"), resource, "Resource");
  }

  /**
   * Change fields of a resource.
   * If its text changes, the references to it are re-anchored (see `relocateReferences`)
   * and the resulting warnings are returned.
   */
  updateResource(
    resource: string | ResourceOf<S>,
    changes: ResourceChanges<Userdata<S, "resource">>,
    options: ThresholdOptions = {},
  ): Issue[] {
    const current = lookup(this.store.resources, resource, "Resource");
    const updated = current.with(touched(current, changes));
    this.store.writable("resources")[updated.id] = updated;

    return updated.text === current.text
      ? []
      : this.relocateReferences({ ...options, resource: updated.id });
  }

  /**
   * Re-anchor references whose text is not found at their offset in their resource,
   * e.g. after the resource has been edited, and fill in missing offsets.
   * A reference is moved to the most similar span near its old offset,
   * if there is none, its offset is unset.
   * Returns a warning for each changed reference.
   */
  relocateReferences(options: RelocateOptions = {}): Issue[] {
    return relocateReferences(this, options);
  }

  /** Remove a resource and unset it (including the offset) in all references, returns its id. */
  removeResource(resource: string | ResourceOf<S>): string[] {
    const { id } = remove(this.store.writable("resources"), resource, "Resource");

    for (const node of this.atoms()) {
      if (node.reference?.resource === id) {
        this.updateAtom(node, { reference: new Reference({ text: node.reference.text }) });
      }
    }

    return [id];
  }

  /** Remove resources that are not referenced by any node and return their ids. */
  cleanResources(): string[] {
    return dropUnused(
      this.store.writable("resources"),
      new Set(this.atoms().map((node) => node.reference?.resource)),
    );
  }

  addParticipant(participant: ParticipantOf<S>): void {
    insert(this.store.writable("participants"), participant, "Participant");
  }

  /** Change fields of a participant. */
  updateParticipant(
    participant: string | ParticipantOf<S>,
    changes: ParticipantChanges<Userdata<S, "participant">>,
  ): void {
    const current = lookup(this.store.participants, participant, "Participant");
    this.store.writable("participants")[current.id] = current.with(touched(current, changes));
  }

  /** Remove a participant and unset it for all its nodes, returns its id. */
  removeParticipant(participant: string | ParticipantOf<S>): string[] {
    const { id } = remove(this.store.writable("participants"), participant, "Participant");

    for (const node of this.atoms()) {
      if (node.participant === id) {
        this.updateAtom(node, { participant: undefined });
      }
    }

    return [id];
  }

  /** Remove participants that are not assigned to any node and return their ids. */
  cleanParticipants(): string[] {
    return dropUnused(
      this.store.writable("participants"),
      new Set(this.atoms().map((node) => node.participant)),
    );
  }

  addAnalyst(analyst: AnalystOf<S>): void {
    insert(this.store.writable("analysts"), analyst, "Analyst");
  }

  /** Change fields of an analyst. */
  updateAnalyst(
    analyst: string | AnalystOf<S>,
    changes: AnalystChanges<Userdata<S, "analyst">>,
  ): void {
    const current = lookup(this.store.analysts, analyst, "Analyst");
    this.store.writable("analysts")[current.id] = current.with(touched(current, changes));
  }

  /** Remove an analyst and return its id. */
  removeAnalyst(analyst: string | AnalystOf<S>): string[] {
    return [remove(this.store.writable("analysts"), analyst, "Analyst").id];
  }

  /**
   * Connect the premises to the conclusion via the scheme node, all part of the graph.
   * The userdata of the new edges is created by `options.edgeUserdata`, which defaults to `{}`
   * and is required if the edge userdata is customized.
   */
  connect(
    premises: Iterable<string | Node<S>>,
    scheme: string | SchemeNodeOf<S>,
    conclusion: string | Node<S>,
    ...args: ConnectArgs<S>
  ): void;
  connect(
    premises: Iterable<string | Node<S>>,
    scheme: string | SchemeNodeOf<S>,
    conclusion: string | Node<S>,
    options?: { readonly edgeUserdata?: () => Userdata<S, "edge"> },
  ): void {
    this.addPath(premises, scheme, conclusion, options?.edgeUserdata ?? defaultUserdata);
  }

  private addPath(
    premises: Iterable<string | Node<S>>,
    scheme: string | SchemeNodeOf<S>,
    conclusion: string | Node<S>,
    edgeUserdata: () => Userdata<S, "edge">,
  ): void {
    const link = (source: string | Node<S>, target: string | Node<S>) =>
      this.addEdge(
        new Edge({ source: idOf(source), target: idOf(target), userdata: edgeUserdata() }),
      );

    for (const premise of premises) {
      link(premise, scheme);
    }

    link(scheme, conclusion);
  }

  /**
   * Connect two nodes of the graph.
   * Atoms cannot be connected directly, so a scheme node with `options.scheme` (untyped by default)
   * is inserted between them and returned.
   * The userdata of the new elements is created by `options.edgeUserdata` and `options.schemeUserdata`,
   * which are required if the userdata of edges or schemes is customized.
   */
  link(
    source: string | Node<S>,
    target: string | Node<S>,
    ...args: LinkArgs<S>
  ): SchemeNodeOf<S> | undefined;
  link(
    source: string | Node<S>,
    target: string | Node<S>,
    options?: {
      readonly scheme?: Scheme;
      readonly edgeUserdata?: () => Userdata<S, "edge">;
      readonly schemeUserdata?: () => Userdata<S, "scheme">;
    },
  ): SchemeNodeOf<S> | undefined {
    const from = this.node(source);
    const to = this.node(target);
    const edgeUserdata = options?.edgeUserdata ?? defaultUserdata;
    const found = this.checkLink(from, to);

    if (found !== undefined) {
      throw new GraphError(found);
    }

    if (from.type !== "atom" || to.type !== "atom") {
      this.addEdge(new Edge({ source: from.id, target: to.id, userdata: edgeUserdata() }));

      return undefined;
    }

    const scheme = new SchemeNode({
      scheme: options?.scheme,
      userdata: (options?.schemeUserdata ?? defaultUserdata)(),
    });
    this.addNode(scheme);
    this.addPath([from], scheme, to, edgeUserdata);

    return scheme;
  }

  /**
   * Remove scheme nodes without a scheme together with their descendants.
   * Returns the ids of all removed nodes and edges.
   */
  removeEmptySchemeBranches(): string[] {
    const empty = this.schemes().filter((scheme) => scheme.scheme.case === undefined);

    return removeBranches(this, this.store, empty);
  }

  /**
   * Remove a node and all its descendants (i.e., nodes connected via incoming edges).
   * An edge is interpreted as its source node, a string as the id of a node.
   * Returns the ids of all removed nodes and edges.
   */
  removeBranch(element: string | Node<S> | EdgeOf<S>): string[] {
    const start = typeof element !== "string" && "source" in element ? element.source : element;
    return removeBranches(this, this.store, [this.node(start)]);
  }
}
