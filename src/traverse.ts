type Entity = { readonly id: string };

/** Neighbors of a node, e.g. `(node) => graph.outgoingNodes(node)`. */
export type Connections<N extends Entity> = (node: N) => Iterable<N>;

function traverse<N extends Entity>(
  start: N,
  connections: Connections<N>,
  includeStart: boolean,
  pop: (pending: N[]) => N | undefined,
): N[] {
  const visited = new Map<string, N>();
  const pending = [start];

  for (let node = pop(pending); node !== undefined; node = pop(pending)) {
    if (!visited.has(node.id)) {
      visited.set(node.id, node);

      for (const neighbor of connections(node)) {
        if (!visited.has(neighbor.id)) {
          pending.push(neighbor);
        }
      }
    }
  }

  if (!includeStart) {
    visited.delete(start.id);
  }

  return visited.values().toArray();
}

/** Visit all nodes reachable from `start` in depth-first order. */
export function dfs<N extends Entity>(
  start: N,
  connections: Connections<N>,
  includeStart = true,
): N[] {
  return traverse(start, connections, includeStart, (pending) => pending.pop());
}

/** Visit all nodes reachable from `start` in breadth-first order. */
export function bfs<N extends Entity>(
  start: N,
  connections: Connections<N>,
  includeStart = true,
): N[] {
  let index = 0;

  return traverse(start, connections, includeStart, (pending) => pending[index++]);
}

function directedNodeDistance<N extends Entity>(
  start: N,
  end: N,
  connections: Connections<N>,
  maxDistance: number,
): number | undefined {
  const visited = new Set([start.id]);
  let frontier = [start];

  for (let distance = 1; distance <= maxDistance && frontier.length > 0; distance++) {
    const next: N[] = [];

    for (const node of frontier) {
      for (const neighbor of connections(node)) {
        if (neighbor.id === end.id) {
          return distance;
        }

        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          next.push(neighbor);
        }
      }
    }

    frontier = next;
  }

  return undefined;
}

/**
 * Get the number of steps between `start` and `end` or undefined if there is no path.
 *
 * @param connections Links between nodes, e.g. `(node) => graph.outgoingNodes(node)`.
 * @param maxDistance Only search for paths having at most this length.
 * @param directed If false, also search for the direction `end` -> `start`.
 */
export function nodeDistance<N extends Entity>(
  start: N,
  end: N,
  connections: Connections<N>,
  maxDistance = Infinity,
  directed = true,
): number | undefined {
  if (start.id === end.id) {
    return 0;
  }

  return (
    directedNodeDistance(start, end, connections, maxDistance) ??
    (directed ? undefined : directedNodeDistance(end, start, connections, maxDistance))
  );
}
