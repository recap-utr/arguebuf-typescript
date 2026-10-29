import { fail } from "#/issue.js";
import type { AnalystOf } from "#/model/analyst.js";
import type { EdgeOf } from "#/model/edge.js";
import { idOf, isEmpty, lookup } from "#/model/graph/helpers.js";
import {
  type AtomRelation,
  atomRelations,
  neighborAtomNodes,
  siblingNodeDistances,
} from "#/model/graph/queries.js";
import { type Adjacency, GraphStore } from "#/model/graph/store.js";
import { type AtomNodeOf, isType, type Node, type SchemeNodeOf, typeArticles } from "#/model/node.js";
import type { ParticipantOf } from "#/model/participant.js";
import type { ResourceOf } from "#/model/resource.js";
import type { UserdataSchema } from "#/model/userdata.js";

/**
 * Read access to the elements of a graph and the queries derived from its adjacency,
 * the base of `Graph`, which adds the methods that change it.
 */
export abstract class GraphView<S extends UserdataSchema = {}> {
  protected store: GraphStore<S> = new GraphStore();

  get nodes(): Readonly<Record<string, Node<S>>> {
    return this.store.nodes;
  }

  get edges(): Readonly<Record<string, EdgeOf<S>>> {
    return this.store.edges;
  }

  get resources(): Readonly<Record<string, ResourceOf<S>>> {
    return this.store.resources;
  }

  get participants(): Readonly<Record<string, ParticipantOf<S>>> {
    return this.store.participants;
  }

  get analysts(): Readonly<Record<string, AnalystOf<S>>> {
    return this.store.analysts;
  }

  /** Atom nodes by id, built on every access, so avoid it in loops. */
  get atomNodes(): Readonly<Record<string, AtomNodeOf<S>>> {
    return Object.fromEntries(this.atoms().map((node) => [node.id, node]));
  }

  /** Scheme nodes by id, built on every access, so avoid it in loops. */
  get schemeNodes(): Readonly<Record<string, SchemeNodeOf<S>>> {
    return Object.fromEntries(this.schemes().map((node) => [node.id, node]));
  }

  protected atoms(): AtomNodeOf<S>[] {
    return Object.values(this.store.nodes).filter((node) => node.type === "atom");
  }

  protected schemes(): SchemeNodeOf<S>[] {
    return Object.values(this.store.nodes).filter((node) => node.type === "scheme");
  }

  get majorClaim(): string | undefined {
    return this.store.majorClaim;
  }

  /** The major claim must be an atom node of this graph. */
  set majorClaim(value: string | AtomNodeOf<S> | undefined) {
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

  /** Atom nodes without outgoing edges. */
  get rootNodes(): AtomNodeOf<S>[] {
    return this.atoms().filter((node) => isEmpty(this.store.outgoing[node.id]));
  }

  /** Atom nodes without incoming edges. */
  get leafNodes(): AtomNodeOf<S>[] {
    return this.atoms().filter((node) => isEmpty(this.store.incoming[node.id]));
  }

  /** The only root node if there is exactly one. */
  get rootNode(): AtomNodeOf<S> | undefined {
    const candidates = this.rootNodes;

    return candidates.length === 1 ? candidates[0] : undefined;
  }

  protected node(node: string | Node<S>): Node<S> {
    return lookup(this.store.nodes, node, "Node");
  }

  protected typedNode<T extends Node["type"]>(
    node: string | Node<S>,
    type: T,
  ): Extract<Node<S>, { type: T }> {
    const current = this.node(node);

    if (!isType(current, type)) {
      fail("unknown-element", `Node '${current.id}' is not ${typeArticles[type]}.`, [current.id]);
    }

    return current;
  }

  incomingEdges(node: string | Node<S>): EdgeOf<S>[] {
    return this.adjacentEdges(this.store.incoming, node);
  }

  outgoingEdges(node: string | Node<S>): EdgeOf<S>[] {
    return this.adjacentEdges(this.store.outgoing, node);
  }

  protected adjacentEdges(adjacency: Readonly<Adjacency>, node: string | Node<S>): EdgeOf<S>[] {
    return Object.keys(adjacency[this.node(node).id]).map((id) => this.store.edges[id]);
  }

  /** Nodes connected to `node` via incoming edges (i.e., its children). */
  incomingNodes(node: string | Node<S>): Node<S>[] {
    const ids = new Set(this.incomingEdges(node).map((edge) => edge.source));

    return Array.from(ids, (id) => this.store.nodes[id]);
  }

  /** Nodes connected to `node` via outgoing edges (i.e., its parents). */
  outgoingNodes(node: string | Node<S>): Node<S>[] {
    const ids = new Set(this.outgoingEdges(node).map((edge) => edge.target));

    return Array.from(ids, (id) => this.store.nodes[id]);
  }

  /** Nodes connected to `node` via incoming or outgoing edges. */
  neighborNodes(node: string | Node<S>): Node<S>[] {
    return [...new Set([...this.incomingNodes(node), ...this.outgoingNodes(node)])];
  }

  /** Atom nodes connected to `scheme` via incoming edges, i.e. its premises. */
  premiseNodes(scheme: string | SchemeNodeOf<S>): AtomNodeOf<S>[] {
    return this.incomingNodes(scheme).filter((node) => node.type === "atom");
  }

  /** Closest atom nodes connected to `node` via incoming edges, skipping scheme nodes. */
  incomingAtomNodes(node: string | Node<S>): AtomNodeOf<S>[] {
    return neighborAtomNodes(this.node(node), (x) => this.incomingNodes(x));
  }

  /** Closest atom nodes connected to `node` via outgoing edges, skipping scheme nodes. */
  outgoingAtomNodes(node: string | Node<S>): AtomNodeOf<S>[] {
    return neighborAtomNodes(this.node(node), (x) => this.outgoingNodes(x));
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
    return siblingNodeDistances(this, this.node(node), maxLevels, nodeType);
  }

  siblingNodes(node: string | Node<S>, maxLevels = 1, nodeType?: Node["type"]): Node<S>[] {
    const distances = this.siblingNodeDistances(node, maxLevels, nodeType);

    return Array.from(distances.keys(), (id) => this.store.nodes[id]);
  }

  /** The scheme node connecting `premise` and `claim` if there is exactly one. */
  schemeBetween(
    premise: string | AtomNodeOf<S>,
    claim: string | AtomNodeOf<S>,
  ): SchemeNodeOf<S> | undefined {
    const claimId = this.node(claim).id;
    const candidates = this.outgoingNodes(premise)
      .filter((node) => node.type === "scheme")
      .filter((node) => this.outgoingEdges(node).some((edge) => edge.target === claimId));

    return candidates.length === 1 ? candidates[0] : undefined;
  }

  /**
   * Relations between atoms with the scheme nodes collapsed, e.g. to show only the hierarchy of claims.
   * The graph is not changed, as it cannot contain edges between atoms.
   * Each pair of atoms is related once, self-loops are skipped.
   */
  atomRelations(): AtomRelation<S>[] {
    return atomRelations(this);
  }
}
