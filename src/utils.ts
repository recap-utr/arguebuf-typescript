import { Graph } from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** The element with a clone of its userdata, all other fields are immutable. */
function cloned<E extends { readonly userdata: unknown; with(changes: { userdata: E["userdata"] }): E }>(
  element: E,
): E {
  return element.with({ userdata: structuredClone(element.userdata) });
}

/**
 * Create a deep copy of a graph without changing the input.
 *
 * Elements are immutable, so only the userdata is copied, with `structuredClone` instead of its codec,
 * so in-memory data is kept.
 * It must be structured-cloneable: typed arrays are copied, but class instances become plain objects.
 */
export function deepCopy<S extends UserdataSchema>(graph: Graph<S>): Graph<S> {
  return new Graph<S>({
    name: graph.name,
    metadata: graph.metadata,
    userdata: structuredClone(graph.userdata),
    resources: Object.values(graph.resources).map(cloned),
    participants: Object.values(graph.participants).map(cloned),
    analysts: Object.values(graph.analysts).map(cloned),
    nodes: Object.values(graph.nodes).map((node) =>
      node.type === "atom" ? cloned(node) : cloned(node),
    ),
    edges: Object.values(graph.edges).map(cloned),
    majorClaim: graph.majorClaim,
  });
}
