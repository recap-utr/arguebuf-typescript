// Removal of nodes, cascading to the scheme nodes that are left dangling.
import { fail } from "#/issue.js";
import { dfs } from "#/traverse.js";
import type { Graph } from "#/model/graph.js";
import type { GraphStore } from "#/model/graph/store.js";
import type { Node } from "#/model/node.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Whether the node is a scheme of the graph without a premise or without a conclusion. */
function isDangling<S extends UserdataSchema>(
  graph: Graph<S>,
  store: GraphStore<S>,
  node: Node<S>,
): boolean {
  return (
    node.type === "scheme" &&
    Object.hasOwn(store.nodes, node.id) &&
    (graph.premiseNodes(node).length === 0 || graph.outgoingEdges(node).length === 0)
  );
}

/** Delete the node and the schemes left dangling, collecting the ids of removed atoms. */
function cascade<S extends UserdataSchema>(
  graph: Graph<S>,
  store: GraphStore<S>,
  node: Node<S>,
  atoms: Set<string>,
): void {
  const pending = [node];

  for (let current = pending.pop(); current !== undefined; current = pending.pop()) {
    if (Object.hasOwn(store.nodes, current.id)) {
      const neighbors = graph.neighborNodes(current);
      store.deleteNode(current);

      if (current.type === "atom") {
        atoms.add(current.id);
      }

      pending.push(...neighbors.filter((neighbor) => isDangling(graph, store, neighbor)));
    }
  }
}

/** Remove the atoms from the premise descriptors, which only reference atom nodes. */
function removeDescriptors<S extends UserdataSchema>(
  graph: Graph<S>,
  ids: ReadonlySet<string>,
): void {
  if (ids.size === 0) {
    return;
  }

  for (const scheme of Object.values(graph.nodes)) {
    if (scheme.type === "scheme" && scheme.premiseDescriptors.some((id) => ids.has(id))) {
      graph.updateScheme(scheme, {
        premiseDescriptors: scheme.premiseDescriptors.filter((id) => !ids.has(id)),
      });
    }
  }
}

/** See `Graph.removeNode`. */
export function removeNode<S extends UserdataSchema>(
  graph: Graph<S>,
  store: GraphStore<S>,
  node: Node<S>,
): void {
  const atoms = new Set<string>();
  cascade(graph, store, node, atoms);
  removeDescriptors(graph, atoms);
}

/** See `Graph.removeElements`. */
export function removeElements<S extends UserdataSchema>(
  graph: Graph<S>,
  store: GraphStore<S>,
  ids: Iterable<string>,
): void {
  const elements = [...ids];
  const kinds = [store.nodes, store.edges, store.resources, store.participants];

  for (const id of elements) {
    if (!kinds.some((kind) => Object.hasOwn(kind, id))) {
      fail("unknown-element", `Element '${id}' does not exist.`, [id]);
    }
  }

  const atoms = new Set<string>();

  for (const id of elements) {
    if (Object.hasOwn(store.nodes, id)) {
      cascade(graph, store, store.nodes[id], atoms);
    } else if (Object.hasOwn(store.edges, id)) {
      graph.removeEdge(id);
    } else if (Object.hasOwn(store.resources, id)) {
      graph.removeResource(id);
    } else if (Object.hasOwn(store.participants, id)) {
      graph.removeParticipant(id);
    }
  }

  removeDescriptors(graph, atoms);
}

/** See `Graph.removeBranch`. */
export function removeBranch<S extends UserdataSchema>(
  graph: Graph<S>,
  store: GraphStore<S>,
  start: Node<S>,
): void {
  const branch = dfs(start, (node) => graph.incomingNodes(node));

  for (const node of branch) {
    store.deleteNode(node);
  }

  removeDescriptors(
    graph,
    new Set(branch.filter((node) => node.type === "atom").map((node) => node.id)),
  );
}
