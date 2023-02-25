import * as date from "../date.js";
import * as model from "../model/index.js";
import * as aifSchema from "../schemas/aif.js";

const scheme2aif: { [key in model.SchemeType]: aifSchema.SchemeType } = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

function label(node: model.NodeInterface): string {
  if (node.type === "atom") {
    return node.text;
  } else if (node.type === "scheme") {
    let text = "Unknown";

    if (node.scheme.case !== undefined) {
      const schemeType = node.scheme.case;
      text = schemeType;

      const schemeValue = model.scheme2string(node.scheme);

      if (schemeValue !== "DEFAULT") {
        // TODO
      }
    }

    return text;
  }

  return "Unknown";
}

export function aif(obj: model.GraphInterface): aifSchema.Graph {
  return {
    nodes: Object.values(obj.nodes).map((entry) => nodeToAif(entry)),
    edges: Object.values(obj.edges).map((entry) => edgeToAif(entry)),
    locutions: [],
  };
}

function nodeToAif(n: model.NodeInterface): aifSchema.Node {
  if (n.type === "atom") {
    return {
      nodeID: n.id,
      text: n.text,
      type: "I",
      timestamp: date.format(n.metadata.updated, aifSchema.DATE_FORMAT),
    };
  } else if (n.type === "scheme") {
    return {
      nodeID: n.id,
      text: label(n),
      type: n.scheme.case ? scheme2aif[n.scheme.case] : "",
      timestamp: date.format(n.metadata.updated, aifSchema.DATE_FORMAT),
    };
  }

  throw new Error("Node type not supported");
}

function edgeToAif(e: model.EdgeInterface): aifSchema.Edge {
  return {
    edgeID: e.id,
    fromID: e.source,
    toID: e.target,
    formEdgeID: null,
  };
}
