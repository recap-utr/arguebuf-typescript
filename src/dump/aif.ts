import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { isDefaultScheme, schemeValueLabel } from "#/model/scheme.js";
import type * as aifSchema from "#/schemas/aif.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Export a graph to the AIF format, without locutions. */
export function aif<S extends UserdataSchema>(obj: model.Graph<S>): aifSchema.Graph {
  return {
    nodes: Object.values(obj.nodes).map((node) => nodeToAif(node, true)),
    edges: Object.values(obj.edges).map((edge) => ({ ...edgeToAif(edge), formEdgeID: null })),
    locutions: [],
  };
}

function schemeText(scheme: model.Scheme): string {
  if (scheme.case === undefined) {
    return model.NO_SCHEME_LABEL;
  }

  return isDefaultScheme(scheme) ? model.scheme2aifDefault[scheme.case] : schemeValueLabel(scheme);
}

/** Export an atom or scheme node to an AIF node, with or without timestamp. */
export function nodeToAif<S extends UserdataSchema>(
  node: model.Node<S>,
  timestamp: boolean,
): aifSchema.Node {
  const result: aifSchema.Node =
    node.type === "atom"
      ? { nodeID: node.id, text: node.text, type: "I" }
      : {
          nodeID: node.id,
          text: schemeText(node.scheme),
          type: node.scheme.case === undefined ? "" : model.scheme2aif[node.scheme.case],
        };

  if (timestamp) {
    result.timestamp = date.formatAif(node.metadata.updated);
  }

  return result;
}

export function edgeToAif(edge: Pick<model.Edge, "id" | "source" | "target">): aifSchema.Edge {
  return { edgeID: edge.id, fromID: edge.source, toID: edge.target };
}
