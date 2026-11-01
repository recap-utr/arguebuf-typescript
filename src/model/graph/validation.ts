// Rules that elements must satisfy to be added to a graph.
import { fail, GraphError, type Issue, issue } from "#/issue.js";
import type { EdgeOf } from "#/model/edge.js";
import type { GraphStore } from "#/model/graph/store.js";
import type { AtomNodeOf } from "#/model/node.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** The participant and the resource of the reference must be part of the graph. */
export function validateAtom<S extends UserdataSchema>(
  store: GraphStore<S>,
  node: AtomNodeOf<S>,
): void {
  if (node.participant !== undefined && !Object.hasOwn(store.participants, node.participant)) {
    fail(
      "unknown-element",
      `Participant '${node.participant}' of node '${node.id}' does not exist.`,
      [node.id, node.participant],
    );
  }

  const resource = node.reference?.resource;

  if (resource !== undefined && !Object.hasOwn(store.resources, resource)) {
    fail("unknown-element", `Resource '${resource}' of node '${node.id}' does not exist.`, [
      node.id,
      resource,
    ]);
  }
}

/**
 * The issue that prevents an edge from the source to the target, if any.
 * Both must be part of the graph, self-loops, edges between two atoms, and parallel edges are rejected.
 * The elements of the issue start with `id` if it is given.
 */
export function edgeIssue<S extends UserdataSchema>(
  store: GraphStore<S>,
  source: string,
  target: string,
  id?: string,
): Issue | undefined {
  const prefix = id === undefined ? [] : [id];
  const missing = [source, target].find((node) => !Object.hasOwn(store.nodes, node));

  if (missing !== undefined) {
    return issue("unknown-element", `Node '${missing}' does not exist.`, [...prefix, missing]);
  }

  if (source === target) {
    return issue("self-loop", `Node '${source}' cannot be connected to itself.`, [
      ...prefix,
      source,
    ]);
  }

  if (store.nodes[source].type === "atom" && store.nodes[target].type === "atom") {
    return issue(
      "atom-edge",
      `The atoms '${source}' and '${target}' cannot be connected directly.`,
      [...prefix, source, target],
    );
  }

  if (Object.keys(store.outgoing[source]).some((edge) => store.edges[edge].target === target)) {
    return issue("parallel-edge", `Nodes '${source}' and '${target}' are already connected.`, [
      ...prefix,
      source,
      target,
    ]);
  }

  return undefined;
}

/** Throw the issue that prevents the edge, see `edgeIssue`. */
export function validateEdge<S extends UserdataSchema>(
  store: GraphStore<S>,
  edge: EdgeOf<S>,
): void {
  const found = edgeIssue(store, edge.source, edge.target, edge.id);

  if (found !== undefined) {
    throw new GraphError(found);
  }
}
