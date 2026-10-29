// Queries derived from the adjacency of a graph.
import type { GraphView } from "#/model/graph/view.js";
import type { Entity } from "#/model/graph/helpers.js";
import type { AtomNodeOf, Node, SchemeNodeOf } from "#/model/node.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Atoms connected through scheme nodes, see `Graph.atomRelations`. */
export interface AtomRelation<S extends UserdataSchema = {}> {
  readonly source: AtomNodeOf<S>;
  readonly target: AtomNodeOf<S>;
  /** The first scheme node connecting them. */
  readonly scheme: SchemeNodeOf<S>;
}

/** Unique neighbors of all given nodes. */
function layer<N extends Entity>(nodes: readonly N[], neighbors: (node: N) => N[]): N[] {
  return [...new Map(nodes.flatMap(neighbors).map((node) => [node.id, node])).values()];
}

/** Closest atom nodes connected to `start` via `neighbors`, skipping scheme nodes. */
export function neighborAtomNodes<S extends UserdataSchema>(
  start: Node<S>,
  neighbors: (node: Node<S>) => Node<S>[],
): AtomNodeOf<S>[] {
  const visited = new Set([start.id]);
  const atomNodes: AtomNodeOf<S>[] = [];
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

/** See `Graph.siblingNodeDistances`. */
export function siblingNodeDistances<S extends UserdataSchema>(
  graph: GraphView<S>,
  start: Node<S>,
  maxLevels: number,
  nodeType: Node["type"] | undefined,
): Map<string, number> {
  const distances = new Map<string, number>();
  const visited = new Set([start.id]);
  const parents = (x: Node<S>) => graph.outgoingNodes(x);
  const children = (x: Node<S>) => graph.incomingNodes(x);
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

/** See `Graph.atomRelations`. */
export function atomRelations<S extends UserdataSchema>(graph: GraphView<S>): AtomRelation<S>[] {
  const relations: AtomRelation<S>[] = [];
  // targets related to each source
  const related = new Map<string, Set<string>>();

  for (const scheme of Object.values(graph.nodes).filter((node) => node.type === "scheme")) {
    const targets = graph.outgoingAtomNodes(scheme);

    for (const source of graph.incomingAtomNodes(scheme)) {
      const seen = related.get(source.id) ?? new Set([source.id]);
      related.set(source.id, seen);

      for (const target of targets.filter(({ id }) => !seen.has(id))) {
        seen.add(target.id);
        relations.push({ source, target, scheme });
      }
    }
  }

  return relations;
}
