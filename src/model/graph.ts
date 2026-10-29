import type { Issue } from "#/issue.js";
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
import type { AtomRelation } from "#/model/graph/queries.js";
import { relocateReferences, type RelocateOptions } from "#/model/graph/references.js";
import { removeBranch, removeElements, removeNode } from "#/model/graph/removal.js";
import { validateAtom, validateEdge } from "#/model/graph/validation.js";
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
import type { ResourceChanges, ResourceOf } from "#/model/resource.js";
import {
  type OptionalInit,
  initUserdata,
  type Userdata,
  type UserdataFactoryArgs,
  type UserdataInit,
  type UserdataSchema,
} from "#/model/userdata.js";

export type { AtomRelation, RelocateOptions };

/** Userdata factories of `Graph.link`, required if the userdata of schemes or edges is customized. */
export interface LinkUserdata<S extends UserdataSchema> {
  readonly scheme: () => Userdata<S, "scheme">;
  readonly edge: () => Userdata<S, "edge">;
}

export type LinkArgs<S extends UserdataSchema> = {} extends Userdata<S, "scheme"> &
  Userdata<S, "edge">
  ? [userdata?: LinkUserdata<S>]
  : [userdata: LinkUserdata<S>];

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

/**
 * Argument graph consisting of atom nodes, scheme nodes, and edges.
 *
 * Elements are immutable, they are added, updated, and removed through the methods of the graph,
 * which validate references and cascade removals.
 * Violations throw a `GraphError` whose `issue` describes the cause.
 * Adjacency queries take time proportional to the degree of the node.
 */
export class Graph<S extends UserdataSchema = {}> extends GraphView<S> {
  name?: string;
  metadata: Metadata;
  userdata: Userdata<S, "graph">;
  constructor(...[init]: OptionalInit<GraphInit<S>>) {
    super();
    this.name = init?.name;
    this.metadata = init?.metadata ?? new Metadata();
    this.userdata = initUserdata<Userdata<S, "graph">>(init);

    for (const resource of init?.resources ?? []) {
      this.addResource(resource);
    }

    for (const participant of init?.participants ?? []) {
      this.addParticipant(participant);
    }

    for (const analyst of init?.analysts ?? []) {
      this.addAnalyst(analyst);
    }

    for (const node of init?.nodes ?? []) {
      this.addNode(node);
    }

    for (const edge of init?.edges ?? []) {
      this.addEdge(edge);
    }

    this.majorClaim = init?.majorClaim;
  }

  /**
   * Copy the structure of the graph, sharing its immutable elements and userdata.
   * This is cheap, so changes can be made on a copy while the original stays intact.
   * See `deepCopy` to copy the userdata as well.
   */
  copy(): Graph<S> {
    const copy = new Graph<S>({
      name: this.name,
      metadata: this.metadata,
      userdata: this.userdata,
    });
    copy.store = this.store.fork();

    return copy;
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
   */
  removeNode(node: string | Node<S>): void {
    removeNode(this, this.store, this.node(node));
  }

  /**
   * Remove elements of any kind (nodes, edges, resources, participants) by id at once.
   * All ids must exist, otherwise nothing is removed.
   * Elements that a removal cascades to may be listed as well.
   */
  removeElements(ids: Iterable<string>): void {
    removeElements(this, this.store, ids);
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

  removeEdge(edge: string | EdgeOf<S>): void {
    this.store.deleteEdge(lookup(this.store.edges, edge, "Edge"));
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

  /** Remove a resource and unset it (including the offset) in all references. */
  removeResource(resource: string | ResourceOf<S>): void {
    const { id } = remove(this.store.writable("resources"), resource, "Resource");

    for (const node of this.atoms()) {
      if (node.reference?.resource === id) {
        this.updateAtom(node, { reference: new Reference({ text: node.reference.text }) });
      }
    }
  }

  /** Remove resources that are not referenced by any node. */
  cleanResources(): void {
    dropUnused(
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

  /** Remove a participant and unset it for all its nodes. */
  removeParticipant(participant: string | ParticipantOf<S>): void {
    const { id } = remove(this.store.writable("participants"), participant, "Participant");

    for (const node of this.atoms()) {
      if (node.participant === id) {
        this.updateAtom(node, { participant: undefined });
      }
    }
  }

  /** Remove participants that are not assigned to any node. */
  cleanParticipants(): void {
    dropUnused(
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
    // analysts have no metadata
    this.store.writable("analysts")[current.id] = current.with(changes);
  }

  removeAnalyst(analyst: string | AnalystOf<S>): void {
    remove(this.store.writable("analysts"), analyst, "Analyst");
  }

  /**
   * Connect the premises to the conclusion via the scheme node, all part of the graph.
   * The userdata of the new edges is created by `userdata`, which defaults to `{}`
   * and is required if the edge userdata is customized.
   */
  connect(
    premises: Iterable<string | Node<S>>,
    scheme: string | SchemeNodeOf<S>,
    conclusion: string | Node<S>,
    ...[userdata]: UserdataFactoryArgs<Userdata<S, "edge">>
  ): void {
    const create = userdata ?? (() => initUserdata<Userdata<S, "edge">>(undefined));
    const link = (source: string | Node<S>, target: string | Node<S>) =>
      this.addEdge(new Edge({ source: idOf(source), target: idOf(target), userdata: create() }));

    for (const premise of premises) {
      link(premise, scheme);
    }

    link(scheme, conclusion);
  }

  /**
   * Connect two nodes of the graph.
   * Atoms cannot be connected directly, so an untyped scheme node is inserted between them and returned.
   * The userdata of the new elements is created by `userdata`, which is required if it is customized.
   */
  link(
    source: string | Node<S>,
    target: string | Node<S>,
    ...[userdata]: LinkArgs<S>
  ): SchemeNodeOf<S> | undefined {
    const from = this.node(source);
    const to = this.node(target);
    const edge = userdata?.edge ?? (() => initUserdata<Userdata<S, "edge">>(undefined));

    if (from.type !== "atom" || to.type !== "atom") {
      this.addEdge(new Edge({ source: from.id, target: to.id, userdata: edge() }));

      return undefined;
    }

    const scheme = new SchemeNode({
      userdata: userdata?.scheme() ?? initUserdata<Userdata<S, "scheme">>(undefined),
    });
    this.addNode(scheme);
    this.connect([from], scheme, to, edge);

    return scheme;
  }

  /** Remove scheme nodes without a scheme together with their descendants. */
  removeEmptySchemeBranches(): void {
    for (const scheme of this.schemes()) {
      if (scheme.scheme.case === undefined && Object.hasOwn(this.store.nodes, scheme.id)) {
        this.removeBranch(scheme);
      }
    }
  }

  /**
   * Remove a node and all its descendants (i.e., nodes connected via incoming edges).
   * An edge is interpreted as its source node, a string as the id of a node.
   */
  removeBranch(element: string | Node<S> | EdgeOf<S>): void {
    const start = typeof element !== "string" && "source" in element ? element.source : element;
    removeBranch(this, this.store, this.node(start));
  }
}
