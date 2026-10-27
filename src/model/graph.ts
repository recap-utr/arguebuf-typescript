import { immerable } from "immer";
import { dfs } from "../traverse.js";
import type { Analyst } from "./analyst.js";
import { Edge } from "./edge.js";
import { Metadata } from "./metadata.js";
import type { AtomNode, Node, SchemeNode } from "./node.js";
import type { Participant } from "./participant.js";
import { Reference } from "./reference.js";
import type { Resource } from "./resource.js";
import {
  type OptionalInit,
  initUserdata,
  type Userdata,
  type UserdataFactoryArgs,
  type UserdataInit,
  type UserdataSchema,
} from "./userdata.js";

export type GraphInit<S extends UserdataSchema = {}> = {
  name?: string;
  nodes?: Iterable<Node<S>>;
  edges?: Iterable<Edge<S>>;
  resources?: Iterable<Resource<S>>;
  participants?: Iterable<Participant<S>>;
  analysts?: Iterable<Analyst<S>>;
  majorClaim?: string;
  metadata?: Metadata;
} & UserdataInit<Userdata<S, "graph">>;

type Entity = { readonly id: string };
// ids of the incoming or outgoing edges of each node
type Adjacency = Record<string, Record<string, true>>;

function record<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function idOf(element: string | Entity): string {
  return typeof element === "string" ? element : element.id;
}

/** Unique neighbors of all given nodes. */
function layer<N extends Entity>(nodes: readonly N[], neighbors: (node: N) => N[]): N[] {
  return [...new Map(nodes.flatMap(neighbors).map((node) => [node.id, node])).values()];
}

function drop(store: Record<string, unknown>, id: string): void {
  // oxlint-disable-next-line typescript/no-dynamic-delete
  delete store[id];
}

/** Remove the elements whose ids are not `used`. */
function dropUnused(store: Record<string, unknown>, used: ReadonlySet<string | undefined>): void {
  for (const id of new Set(Object.keys(store)).difference(used)) {
    drop(store, id);
  }
}

function isEmpty(record: object): boolean {
  return Object.keys(record).length === 0;
}

function insert<T extends Entity>(store: Record<string, T>, element: T, kind: string): void {
  if (Object.hasOwn(store, element.id)) {
    throw new Error(`${kind} '${element.id}' already exists.`);
  }

  store[element.id] = element;
}

function remove<T extends Entity>(store: Record<string, T>, element: string | T, kind: string): T {
  const id = idOf(element);

  if (!Object.hasOwn(store, id)) {
    throw new Error(`${kind} '${id}' does not exist.`);
  }

  const removed = store[id];
  drop(store, id);

  return removed;
}

/**
 * Argument graph consisting of atom nodes, scheme nodes, and edges.
 *
 * Elements are added and removed through the methods of the graph,
 * which validate references and cascade removals.
 * Adjacency queries take time proportional to the degree of the node.
 */
export class Graph<S extends UserdataSchema = {}> {
  static [immerable] = true;
  name?: string;
  metadata: Metadata;
  userdata: Userdata<S, "graph">;
  protected _nodes = record<Node<S>>();
  protected _edges = record<Edge<S>>();
  protected _resources = record<Resource<S>>();
  protected _participants = record<Participant<S>>();
  protected _analysts = record<Analyst<S>>();
  // edge ids instead of objects, so that immer drafts are not shared
  protected _incoming: Adjacency = record();
  protected _outgoing: Adjacency = record();
  protected _majorClaim?: string;

  constructor(...[init]: OptionalInit<GraphInit<S>>) {
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

  get nodes(): Readonly<Record<string, Node<S>>> {
    return this._nodes;
  }

  get edges(): Readonly<Record<string, Edge<S>>> {
    return this._edges;
  }

  get resources(): Readonly<Record<string, Resource<S>>> {
    return this._resources;
  }

  get participants(): Readonly<Record<string, Participant<S>>> {
    return this._participants;
  }

  get analysts(): Readonly<Record<string, Analyst<S>>> {
    return this._analysts;
  }

  /** Atom nodes by id, built on every access, so avoid it in loops. */
  get atomNodes(): Readonly<Record<string, AtomNode<S>>> {
    return Object.fromEntries(this.atoms().map((node) => [node.id, node]));
  }

  /** Scheme nodes by id, built on every access, so avoid it in loops. */
  get schemeNodes(): Readonly<Record<string, SchemeNode<S>>> {
    return Object.fromEntries(this.schemes().map((node) => [node.id, node]));
  }

  protected atoms(): AtomNode<S>[] {
    return Object.values(this._nodes).filter((node) => node.type === "atom");
  }

  protected schemes(): SchemeNode<S>[] {
    return Object.values(this._nodes).filter((node) => node.type === "scheme");
  }

  get majorClaim(): string | undefined {
    return this._majorClaim;
  }

  /** The major claim must be an atom node of this graph. */
  set majorClaim(value: string | AtomNode<S> | undefined) {
    if (value !== undefined) {
      const node = this.node(value);

      if (node.type !== "atom") {
        throw new Error(`Only atom nodes can be the major claim, '${node.id}' is a scheme node.`);
      }
    }

    this._majorClaim = value === undefined ? undefined : idOf(value);
  }

  /** Atom nodes without outgoing edges. */
  get rootNodes(): AtomNode<S>[] {
    return this.atoms().filter((node) => isEmpty(this._outgoing[node.id]));
  }

  /** Atom nodes without incoming edges. */
  get leafNodes(): AtomNode<S>[] {
    return this.atoms().filter((node) => isEmpty(this._incoming[node.id]));
  }

  /** The only root node if there is exactly one. */
  get rootNode(): AtomNode<S> | undefined {
    const candidates = this.rootNodes;

    return candidates.length === 1 ? candidates[0] : undefined;
  }

  protected node(node: string | Node<S>): Node<S> {
    const id = idOf(node);

    if (!Object.hasOwn(this._nodes, id)) {
      throw new Error(`Node '${id}' does not exist.`);
    }

    return this._nodes[id];
  }

  incomingEdges(node: string | Node<S>): Edge<S>[] {
    return this.adjacentEdges(this._incoming, node);
  }

  outgoingEdges(node: string | Node<S>): Edge<S>[] {
    return this.adjacentEdges(this._outgoing, node);
  }

  protected adjacentEdges(adjacency: Adjacency, node: string | Node<S>): Edge<S>[] {
    return Object.keys(adjacency[this.node(node).id]).map((id) => this._edges[id]);
  }

  /** Nodes connected to `node` via incoming edges (i.e., its children). */
  incomingNodes(node: string | Node<S>): Node<S>[] {
    const ids = new Set(this.incomingEdges(node).map((edge) => edge.source));

    return Array.from(ids, (id) => this._nodes[id]);
  }

  /** Nodes connected to `node` via outgoing edges (i.e., its parents). */
  outgoingNodes(node: string | Node<S>): Node<S>[] {
    const ids = new Set(this.outgoingEdges(node).map((edge) => edge.target));

    return Array.from(ids, (id) => this._nodes[id]);
  }

  /** Closest atom nodes connected to `node` via incoming edges, skipping scheme nodes. */
  incomingAtomNodes(node: string | Node<S>): AtomNode<S>[] {
    return this.neighborAtomNodes(node, (x) => this.incomingNodes(x));
  }

  /** Closest atom nodes connected to `node` via outgoing edges, skipping scheme nodes. */
  outgoingAtomNodes(node: string | Node<S>): AtomNode<S>[] {
    return this.neighborAtomNodes(node, (x) => this.outgoingNodes(x));
  }

  protected neighborAtomNodes(
    node: string | Node<S>,
    neighbors: (node: Node<S>) => Node<S>[],
  ): AtomNode<S>[] {
    const start = this.node(node);
    const visited = new Set([start.id]);
    const atomNodes: AtomNode<S>[] = [];
    const pending = neighbors(start);

    for (let candidate = pending.pop(); candidate !== undefined; candidate = pending.pop()) {
      if (visited.has(candidate.id)) {
        continue;
      }

      visited.add(candidate.id);

      if (candidate.type === "atom") {
        atomNodes.push(candidate);
      } else {
        for (const neighbor of neighbors(candidate)) {
          pending.push(neighbor);
        }
      }
    }

    return atomNodes;
  }

  /**
   * Find the ids of the sibling nodes of `node` together with their distance.
   *
   * Each ancestor is reached via its shortest path up (via outgoing edges) of length `n`.
   * The siblings at distance `n` are the nodes exactly `n` levels below it (via incoming edges).
   * Each sibling gets its minimal distance, the start node is excluded.
   * Use `Infinity` for `maxLevels` to search the whole graph.
   */
  siblingNodeDistances(
    node: string | Node<S>,
    maxLevels = 1,
    nodeType?: Node["type"],
  ): Map<string, number> {
    const start = this.node(node);
    const distances = new Map<string, number>();
    const visited = new Set([start.id]);
    const parents = (x: Node<S>) => this.outgoingNodes(x);
    const children = (x: Node<S>) => this.incomingNodes(x);
    let ancestors: Node<S>[] = [start];

    for (let level = 1; level <= maxLevels && ancestors.length > 0; level++) {
      ancestors = layer(ancestors, parents).filter((ancestor) => !visited.has(ancestor.id));
      ancestors.forEach((ancestor) => visited.add(ancestor.id));
      let descendants = ancestors;

      for (let step = 0; step < level; step++) {
        descendants = layer(descendants, children);
      }

      for (const sibling of descendants) {
        if (
          sibling.id !== start.id &&
          (nodeType === undefined || sibling.type === nodeType) &&
          !distances.has(sibling.id)
        ) {
          distances.set(sibling.id, level);
        }
      }
    }

    return distances;
  }

  siblingNodes(node: string | Node<S>, maxLevels = 1, nodeType?: Node["type"]): Node<S>[] {
    const distances = this.siblingNodeDistances(node, maxLevels, nodeType);

    return Array.from(distances.keys(), (id) => this._nodes[id]);
  }

  /** The scheme node connecting `premise` and `claim` if there is exactly one. */
  schemeBetween(
    premise: string | AtomNode<S>,
    claim: string | AtomNode<S>,
  ): SchemeNode<S> | undefined {
    const claimId = this.node(claim).id;
    const candidates = this.outgoingNodes(premise)
      .filter((node) => node.type === "scheme")
      .filter((node) => this.outgoingEdges(node).some((edge) => edge.target === claimId));

    return candidates.length === 1 ? candidates[0] : undefined;
  }

  /** Add a node whose participant and resource are already part of the graph. */
  addNode(node: Node<S>): void {
    if (node.type === "atom") {
      if (node.participant !== undefined && !Object.hasOwn(this._participants, node.participant)) {
        throw new Error(`Participant '${node.participant}' of node '${node.id}' does not exist.`);
      }

      const resource = node.reference?.resource;

      if (resource !== undefined && !Object.hasOwn(this._resources, resource)) {
        throw new Error(`Resource '${resource}' of node '${node.id}' does not exist.`);
      }
    }

    insert(this._nodes, node, "Node");
    this._incoming[node.id] = record();
    this._outgoing[node.id] = record();
  }

  /** Remove a node together with its edges and all references to it. */
  removeNode(node: string | Node<S>): void {
    const removed = this.unlink(node);

    // premise descriptors only reference atom nodes
    if (removed.type === "atom") {
      this.removeDescriptors(new Set([removed.id]));
    }
  }

  /** Remove a node together with its edges, but keep it in the premise descriptors. */
  protected unlink(node: string | Node<S>): Node<S> {
    const removed = remove(this._nodes, node, "Node");

    // the union contains self-loops only once
    for (const id of Object.keys({
      ...this._incoming[removed.id],
      ...this._outgoing[removed.id],
    })) {
      this.removeEdge(id);
    }

    drop(this._incoming, removed.id);
    drop(this._outgoing, removed.id);

    if (this._majorClaim === removed.id) {
      this._majorClaim = undefined;
    }

    return removed;
  }

  protected removeDescriptors(ids: ReadonlySet<string>): void {
    for (const scheme of this.schemes()) {
      if (scheme.premiseDescriptors.some((id) => ids.has(id))) {
        scheme.premiseDescriptors = scheme.premiseDescriptors.filter((id) => !ids.has(id));
      }
    }
  }

  /** Add an edge whose source and target are already part of the graph. */
  addEdge(edge: Edge<S>): void {
    for (const id of [edge.source, edge.target]) {
      if (!Object.hasOwn(this._nodes, id)) {
        throw new Error(`Node '${id}' of edge '${edge.id}' does not exist.`);
      }
    }

    insert(this._edges, edge, "Edge");
    this._outgoing[edge.source][edge.id] = true;
    this._incoming[edge.target][edge.id] = true;
  }

  removeEdge(edge: string | Edge<S>): void {
    const removed = remove(this._edges, edge, "Edge");
    drop(this._outgoing[removed.source], removed.id);
    drop(this._incoming[removed.target], removed.id);
  }

  addResource(resource: Resource<S>): void {
    insert(this._resources, resource, "Resource");
  }

  /** Remove a resource and unset it (including the offset) in all references. */
  removeResource(resource: string | Resource<S>): void {
    const { id } = remove(this._resources, resource, "Resource");

    for (const node of this.atoms()) {
      if (node.reference?.resource === id) {
        node.reference = new Reference({ text: node.reference.text });
      }
    }
  }

  /** Remove resources that are not referenced by any node. */
  cleanResources(): void {
    dropUnused(this._resources, new Set(this.atoms().map((node) => node.reference?.resource)));
  }

  addParticipant(participant: Participant<S>): void {
    insert(this._participants, participant, "Participant");
  }

  /** Remove a participant and unset it for all its nodes. */
  removeParticipant(participant: string | Participant<S>): void {
    const { id } = remove(this._participants, participant, "Participant");

    for (const node of this.atoms()) {
      if (node.participant === id) {
        node.participant = undefined;
      }
    }
  }

  /** Remove participants that are not assigned to any node. */
  cleanParticipants(): void {
    dropUnused(this._participants, new Set(this.atoms().map((node) => node.participant)));
  }

  addAnalyst(analyst: Analyst<S>): void {
    insert(this._analysts, analyst, "Analyst");
  }

  removeAnalyst(analyst: string | Analyst<S>): void {
    remove(this._analysts, analyst, "Analyst");
  }

  /**
   * Remove all scheme nodes and connect their incoming and outgoing atom nodes directly.
   *
   * Can be useful to analyze the structure of atom nodes
   * without considering their relation types.
   * Atom nodes that are already connected do not get an additional edge, self-loops are skipped.
   * The userdata of the new edges is created by `userdata`, which defaults to `{}`
   * and is required if the edge userdata is customized.
   */
  removeSchemeNodes(...[userdata]: UserdataFactoryArgs<Userdata<S, "edge">>): void {
    const create = userdata ?? (() => initUserdata<Userdata<S, "edge">>(undefined));

    for (const scheme of this.schemes()) {
      for (const source of this.incomingAtomNodes(scheme)) {
        for (const target of this.outgoingAtomNodes(scheme)) {
          if (
            source.id !== target.id &&
            !this.outgoingNodes(source).some((node) => node.id === target.id)
          ) {
            this.addEdge(new Edge<S>({ source: source.id, target: target.id, userdata: create() }));
          }
        }
      }

      this.removeNode(scheme);
    }
  }

  /** Remove scheme nodes without a scheme together with their descendants. */
  removeEmptySchemeBranches(): void {
    for (const scheme of this.schemes()) {
      if (scheme.scheme.case === undefined && Object.hasOwn(this._nodes, scheme.id)) {
        this.removeBranch(scheme);
      }
    }
  }

  /**
   * Remove a node and all its descendants (i.e., nodes connected via incoming edges).
   * An edge is interpreted as its source node, a string as the id of a node.
   */
  removeBranch(element: string | Node<S> | Edge<S>): void {
    const start = typeof element !== "string" && "source" in element ? element.source : element;
    const branch = dfs(this.node(start), (node) => this.incomingNodes(node));

    for (const node of branch) {
      this.unlink(node);
    }

    this.removeDescriptors(
      new Set(branch.filter((node) => node.type === "atom").map((node) => node.id)),
    );
  }
}
