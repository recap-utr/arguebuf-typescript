// Rules that elements must satisfy to be added to a graph.
import { fail } from "#/issue.js";
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
 * The source and target must be part of the graph.
 * Self-loops, edges between two atoms, and parallel edges are rejected.
 */
export function validateEdge<S extends UserdataSchema>(
  store: GraphStore<S>,
  edge: EdgeOf<S>,
): void {
  const { source, target } = edge;

  for (const id of [source, target]) {
    if (!Object.hasOwn(store.nodes, id)) {
      fail("unknown-element", `Node '${id}' of edge '${edge.id}' does not exist.`, [edge.id, id]);
    }
  }

  if (source === target) {
    fail("self-loop", `Edge '${edge.id}' connects node '${source}' to itself.`, [edge.id, source]);
  }

  if (store.nodes[source].type === "atom" && store.nodes[target].type === "atom") {
    fail(
      "atom-edge",
      `Edge '${edge.id}' directly connects the atoms '${source}' and '${target}'.`,
      [edge.id, source, target],
    );
  }

  if (Object.keys(store.outgoing[source]).some((id) => store.edges[id].target === target)) {
    fail("parallel-edge", `Nodes '${source}' and '${target}' are already connected.`, [
      edge.id,
      source,
      target,
    ]);
  }
}
