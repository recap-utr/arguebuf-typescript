import type { Graph } from "#/model/graph.js";
import type { UserdataSchema } from "#/model/userdata.js";

export /** Ids of the premises of the scheme. */
function premiseIds<S extends UserdataSchema>(graph: Graph<S>, scheme: string): string[] {
  return graph.premiseNodes(scheme).map(({ id }) => id);
}

export /** Ids of the nodes, resources, and participants of the graph. */
function elementIds<S extends UserdataSchema>(graph: Graph<S>): string[] {
  return [
    ...Object.keys(graph.nodes),
    ...Object.keys(graph.resources),
    ...Object.keys(graph.participants),
  ];
}
