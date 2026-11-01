// the default export of graphology is mistyped, so only named imports are used
import { DirectedGraph } from "graphology";
import type { AtomNodeOf, EdgeOf, GraphView, SchemeNodeOf } from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";

type AttributeFunctions<T> = Readonly<Record<string, (element: T) => unknown>>;

export interface GraphologyOptions<S extends UserdataSchema = {}> {
  graphAttrs?: AttributeFunctions<GraphView<S>>;
  atomAttrs?: AttributeFunctions<AtomNodeOf<S>>;
  schemeAttrs?: AttributeFunctions<SchemeNodeOf<S>>;
  edgeAttrs?: AttributeFunctions<EdgeOf<S>>;
  /** If false, scheme nodes are collapsed into edges between atoms with their `scheme` id. */
  schemeNodes?: boolean;
}

function attrs<T>(element: T, functions: AttributeFunctions<T> = {}): Record<string, unknown> {
  return Object.fromEntries(Object.entries(functions).map(([key, func]) => [key, func(element)]));
}

function nodeAttrs<N extends { readonly label: string }>(
  node: N,
  functions?: AttributeFunctions<N>,
) {
  return { label: node.label, ...attrs(node, functions) };
}

/**
 * Export a graph to a directed graphology graph (https://graphology.github.io).
 *
 * Nodes are keyed by their id and get a `label` attribute unless it is overridden.
 * Further attributes are computed by the given functions, e.g. `{ text: (node) => node.text }`.
 * Edges are keyed by their id, parallel edges are merged into the first one.
 */
export function dumpGraphology<S extends UserdataSchema>(
  graph: GraphView<S>,
  options: GraphologyOptions<S> = {},
): DirectedGraph {
  const result = new DirectedGraph();
  result.replaceAttributes(attrs(graph, options.graphAttrs));

  const nodes = Object.values(graph.nodes);

  for (const atom of nodes.filter((node) => node.type === "atom")) {
    result.addNode(atom.id, nodeAttrs(atom, options.atomAttrs));
  }

  if (options.schemeNodes === false) {
    for (const { source, target, scheme } of graph.atomRelations()) {
      result.addDirectedEdge(source.id, target.id, { scheme: scheme.id });
    }

    return result;
  }

  for (const scheme of nodes.filter((node) => node.type === "scheme")) {
    result.addNode(scheme.id, nodeAttrs(scheme, options.schemeAttrs));
  }

  for (const edge of Object.values(graph.edges)) {
    result.mergeDirectedEdgeWithKey(
      edge.id,
      edge.source,
      edge.target,
      attrs(edge, options.edgeAttrs),
    );
  }

  return result;
}
