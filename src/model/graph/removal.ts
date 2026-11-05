// Removal of nodes, cascading to the scheme nodes that are left dangling.
import { fail } from "#/issue.js";
import { dfs } from "#/traverse.js";
import type { GraphDraft } from "#/model/graph.js";
import type { GraphStore } from "#/model/graph/store.js";
import type { Node } from "#/model/node.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Whether the node is a scheme of the graph without a premise or without a conclusion. */
function isDangling<S extends UserdataSchema>(
  graph: GraphDraft<S>,
  store: GraphStore<S>,
  node: Node<S>,
): boolean {
  return (
    node.type === "scheme" &&
    Object.hasOwn(store.nodes, node.id) &&
    (graph.premiseNodes(node).length === 0 || graph.outgoingEdges(node).length === 0)
  );
}

/** Delete the node with its edges, collecting their ids. */
function deleteNode<S extends UserdataSchema>(
  store: GraphStore<S>,
  node: Node<S>,
  removed: Set<string>,
): void {
  for (const id of [
    node.id,
    ...Object.keys(store.incoming[node.id]),
    ...Object.keys(store.outgoing[node.id]),
  ]) {
    removed.add(id);
  }

  store.deleteNode(node);
}

/** Delete the node and the schemes left dangling, collecting the ids of removed elements. */
function cascade<S extends UserdataSchema>(
  graph: GraphDraft<S>,
  store: GraphStore<S>,
  node: Node<S>,
  removed: Set<string>,
): void {
  const pending = [node];

  for (let current = pending.pop(); current !== undefined; current = pending.pop()) {
    if (Object.hasOwn(store.nodes, current.id)) {
      const neighbors = graph.neighborNodes(current);
      deleteNode(store, current, removed);
      pending.push(...neighbors.filter((neighbor) => isDangling(graph, store, neighbor)));
    }
  }
}

/** Remove the removed atoms from the premise descriptors and return the removed ids. */
function finish<S extends UserdataSchema>(graph: GraphDraft<S>, removed: Set<string>): string[] {
  // ids are unique per kind only, so a removed edge may share the id of a remaining atom
  const isRemoved = (id: string) => removed.has(id) && !Object.hasOwn(graph.nodes, id);

  for (const scheme of Object.values(graph.nodes)) {
    if (scheme.type === "scheme" && scheme.premiseDescriptors.some(isRemoved)) {
      graph.updateScheme(scheme, {
        premiseDescriptors: scheme.premiseDescriptors.filter((id) => !isRemoved(id)),
      });
    }
  }

  return [...removed];
}

/** See `GraphDraft.removeNode`. */
export function removeNode<S extends UserdataSchema>(
  graph: GraphDraft<S>,
  store: GraphStore<S>,
  node: Node<S>,
): string[] {
  const removed = new Set<string>();
  cascade(graph, store, node, removed);

  return finish(graph, removed);
}

/** See `GraphDraft.removeElements`. */
export function removeElements<S extends UserdataSchema>(
  graph: GraphDraft<S>,
  store: GraphStore<S>,
  ids: Iterable<string>,
): string[] {
  const elements = [...ids];
  const kinds = [store.nodes, store.edges, store.resources, store.participants, store.analysts];

  for (const id of elements) {
    if (!kinds.some((kind) => Object.hasOwn(kind, id))) {
      fail("unknown-element", `Element '${id}' does not exist.`, [id]);
    }
  }

  const removed = new Set<string>();

  for (const id of elements) {
    if (Object.hasOwn(store.nodes, id)) {
      cascade(graph, store, store.nodes[id], removed);
    } else if (Object.hasOwn(store.edges, id)) {
      graph.removeEdge(id);
    } else if (Object.hasOwn(store.resources, id)) {
      graph.removeResource(id);
    } else if (Object.hasOwn(store.participants, id)) {
      graph.removeParticipant(id);
    } else if (Object.hasOwn(store.analysts, id)) {
      graph.removeAnalyst(id);
    } else {
      // removed by a cascade earlier in the loop
      continue;
    }

    removed.add(id);
  }

  return finish(graph, removed);
}

/** See `GraphDraft.removeBranch`, the branches of all starts are removed at once. */
export function removeBranches<S extends UserdataSchema>(
  graph: GraphDraft<S>,
  store: GraphStore<S>,
  starts: Iterable<Node<S>>,
): string[] {
  const removed = new Set<string>();

  for (const start of starts) {
    // a branch removed before may contain this one
    if (Object.hasOwn(store.nodes, start.id)) {
      for (const node of dfs(start, (node) => graph.incomingNodes(node))) {
        deleteNode(store, node, removed);
      }
    }
  }

  return finish(graph, removed);
}
