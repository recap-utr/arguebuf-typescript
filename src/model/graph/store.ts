import type { AnalystOf } from "#/model/analyst.js";
import type { EdgeOf } from "#/model/edge.js";
import { drop, insert, record, remove } from "#/model/graph/helpers.js";
import type { Node } from "#/model/node.js";
import type { ParticipantOf } from "#/model/participant.js";
import type { ResourceOf } from "#/model/resource.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Ids of the incoming or outgoing edges of each node. */
export type Adjacency = Record<string, Record<string, true>>;

export interface Containers<S extends UserdataSchema> {
  nodes: Record<string, Node<S>>;
  edges: Record<string, EdgeOf<S>>;
  resources: Record<string, ResourceOf<S>>;
  participants: Record<string, ParticipantOf<S>>;
  analysts: Record<string, AnalystOf<S>>;
  // ids of edges instead of objects, so that updating an edge keeps the adjacency
  incoming: Adjacency;
  outgoing: Adjacency;
}

// not owned by any store, so the first write clones it
const empty = <T>(): Record<string, T> => Object.freeze(record<T>());

/**
 * Containers of a graph with copy on write:
 * they are shared with forks until either store writes to them.
 * Keeps the adjacency of nodes and edges consistent, but does not validate elements.
 */
export class GraphStore<S extends UserdataSchema> {
  majorClaim?: string;
  private containers: Containers<S>;
  // containers that only this store references, the others are shared with forks and frozen
  private readonly owned = new Set<object>();

  constructor(
    containers: Containers<S> = {
      nodes: empty(),
      edges: empty(),
      resources: empty(),
      participants: empty(),
      analysts: empty(),
      incoming: empty(),
      outgoing: empty(),
    },
  ) {
    this.containers = containers;
  }

  get nodes(): Readonly<Record<string, Node<S>>> {
    return this.containers.nodes;
  }

  get edges(): Readonly<Record<string, EdgeOf<S>>> {
    return this.containers.edges;
  }

  get resources(): Readonly<Record<string, ResourceOf<S>>> {
    return this.containers.resources;
  }

  get participants(): Readonly<Record<string, ParticipantOf<S>>> {
    return this.containers.participants;
  }

  get analysts(): Readonly<Record<string, AnalystOf<S>>> {
    return this.containers.analysts;
  }

  get incoming(): Readonly<Adjacency> {
    return this.containers.incoming;
  }

  get outgoing(): Readonly<Adjacency> {
    return this.containers.outgoing;
  }

  /**
   * A store sharing all containers with this one, both clone them before writing.
   * Shared containers are frozen, so neither store can change the other.
   */
  fork(): GraphStore<S> {
    for (const container of this.owned) {
      Object.freeze(container);
    }

    this.owned.clear();
    const fork = new GraphStore<S>({ ...this.containers });
    fork.majorClaim = this.majorClaim;

    return fork;
  }

  /** The container for writing, cloned first if it is shared with a fork. */
  writable<K extends keyof Containers<S>>(key: K): Containers<S>[K] {
    return (this.containers[key] = this.own(this.containers[key]));
  }

  private own<T extends object>(container: T): T {
    if (this.owned.has(container)) {
      return container;
    }

    const clone = Object.assign(record(), container) as T;
    this.owned.add(clone);

    return clone;
  }

  /** The edge ids of a node for writing, cloning the shared adjacency records on the way. */
  private adjacency(direction: "incoming" | "outgoing", id: string): Record<string, true> {
    const adjacency = this.writable(direction);

    return (adjacency[id] = this.own(adjacency[id]));
  }

  /** Add a node without edges. */
  insertNode(node: Node<S>): void {
    insert(this.writable("nodes"), node, "Node");
    this.adjacency("incoming", node.id);
    this.adjacency("outgoing", node.id);
  }

  /** Remove a node together with its edges, unsetting it as major claim. */
  deleteNode(node: string | Node<S>): Node<S> {
    const removed = remove(this.writable("nodes"), node, "Node");

    // the adjacency records of the removed node are dropped as a whole below
    for (const id of [
      ...Object.keys(this.containers.incoming[removed.id]),
      ...Object.keys(this.containers.outgoing[removed.id]),
    ]) {
      this.deleteEdge(this.containers.edges[id], removed.id);
    }

    for (const direction of ["incoming", "outgoing"] as const) {
      this.owned.delete(this.containers[direction][removed.id]);
      drop(this.writable(direction), removed.id);
    }

    if (this.majorClaim === removed.id) {
      this.majorClaim = undefined;
    }

    return removed;
  }

  /** Add an edge between nodes of the store. */
  insertEdge(edge: EdgeOf<S>): void {
    this.writable("edges")[edge.id] = edge;
    this.adjacency("outgoing", edge.source)[edge.id] = true;
    this.adjacency("incoming", edge.target)[edge.id] = true;
  }

  /** Remove the edge from the adjacency of its nodes, except of the node that is removed itself. */
  deleteEdge(edge: EdgeOf<S>, removedNode?: string): void {
    drop(this.writable("edges"), edge.id);

    if (edge.source !== removedNode) {
      drop(this.adjacency("outgoing", edge.source), edge.id);
    }

    if (edge.target !== removedNode) {
      drop(this.adjacency("incoming", edge.target), edge.id);
    }
  }
}
