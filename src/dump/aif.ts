import * as date from "../date.js";
import * as model from "../model/index.js";
import * as aifSchema from "../schemas/aif.js";

const scheme2aif: Record<model.SchemeType, aifSchema.SchemeType> = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

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
      text: model.nodeLabel(n),
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
