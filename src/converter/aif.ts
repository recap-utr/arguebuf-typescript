import * as model from "../model/index.js";
import * as aif from "../schema/aif.js";
import * as date from "../services/date.js";

const scheme2aif: { [key in model.SchemeType]: aif.SchemeType } = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

export function toAif(obj: model.Graph): aif.Graph {
  return {
    nodes: Object.values(obj.nodes).map((entry) => nodeToAif(entry)),
    edges: Object.values(obj.edges).map((entry) => edgeToAif(entry)),
    locutions: [],
  };
}

export function nodeToAif(n: model.Node): aif.Node {
  if (n.type === "atom") {
    return {
      nodeID: n.id,
      text: n.text,
      type: "I",
      timestamp: date.format(n.metadata.updated, aif.DATE_FORMAT),
    };
  } else if (n.type === "scheme") {
    return {
      nodeID: n.id,
      text: n.label(),
      type: n.scheme.case ? scheme2aif[n.scheme.case] : "",
      timestamp: date.format(n.metadata.updated, aif.DATE_FORMAT),
    };
  }

  throw new Error("Node type not supported");
}

export function edgeToAif(e: model.Edge): aif.Edge {
  return {
    edgeID: e.id,
    fromID: e.source.id,
    toID: e.target.id,
    formEdgeID: null,
  };
}

export function fromAif(obj: aif.Graph): model.Graph {
  const nodes = Object.fromEntries(
    obj.nodes.map((node) => [node.nodeID, nodeFromAif(node)])
  );
  const edges = Object.fromEntries(
    obj.edges.map((edge) => [edge.edgeID, edgeFromAif(edge, nodes)])
  );

  return new model.Graph({
    nodes,
    edges,
  });
}

export function nodeFromAif(obj: aif.Node): model.Node {
  if (obj.type === "I") {
    return new model.AtomNode({
      id: obj.nodeID,
      text: obj.text,
      metadata: new model.Metadata({
        created: date.parse(obj.timestamp, aif.DATE_FORMAT),
        updated: date.parse(obj.timestamp, aif.DATE_FORMAT),
      }),
    });
  } else {
    const aifType = obj.type as aif.SchemeType;
    const schemeNode = new model.SchemeNode({
      id: obj.nodeID,
      metadata: new model.Metadata({
        created: date.parse(obj.timestamp, aif.DATE_FORMAT),
        updated: date.parse(obj.timestamp, aif.DATE_FORMAT),
      }),
    });

    switch (aifType) {
      case "RA": {
        schemeNode.scheme = {
          case: "support",
          value: model.Support.DEFAULT,
        };
        break;
      }
      case "CA": {
        schemeNode.scheme = {
          case: "attack",
          value: model.Attack.DEFAULT,
        };
        break;
      }
      case "MA": {
        schemeNode.scheme = {
          case: "rephrase",
          value: model.Rephrase.DEFAULT,
        };
        break;
      }
      case "PA": {
        schemeNode.scheme = {
          case: "preference",
          value: model.Preference.DEFAULT,
        };
        break;
      }
    }

    return schemeNode;
  }
}

export function edgeFromAif(
  obj: aif.Edge,
  nodes: { [key: string]: model.Node }
): model.Edge {
  return new model.Edge({
    id: obj.edgeID,
    source: nodes[obj.fromID],
    target: nodes[obj.toID],
  });
}
