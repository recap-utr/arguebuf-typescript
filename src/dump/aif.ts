import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { isDefaultScheme, schemeValueLabel } from "#/model/scheme.js";
import type * as aifSchema from "#/schemas/aif.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Export a graph to the AIF format, without locutions. */
export function aif<S extends UserdataSchema>(obj: model.GraphView<S>): aifSchema.Graph {
  return {
    nodes: Object.values(obj.nodes).map((node) => nodeToAif(node, true)),
    edges: Object.values(obj.edges).map((edge) => ({ ...edgeToAif(edge), formEdgeID: null })),
    locutions: [],
  };
}

// AIF has no untyped schemes, so they are exported as default inferences like in AIFdb
function schemeText(scheme: model.Scheme): string {
  if (scheme.case === undefined) {
    return model.schemeAifDefaults.support;
  }

  return isDefaultScheme(scheme) ? model.schemeAifDefaults[scheme.case] : schemeValueLabel(scheme);
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
          type: model.schemeAifTypes[node.scheme.case ?? "support"],
        };

  if (timestamp) {
    result.timestamp = date.formatAif(node.metadata.created);
  }

  return result;
}

export function edgeToAif(edge: Pick<model.Edge, "id" | "source" | "target">): aifSchema.Edge {
  return { edgeID: edge.id, fromID: edge.source, toID: edge.target };
}
