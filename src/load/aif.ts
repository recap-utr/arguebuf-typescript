import * as date from "../date.js";
import * as model from "../model/index.js";
import * as aifSchema from "../schemas/aif.js";

export function aif(obj: aifSchema.Graph): model.Graph {
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

function nodeFromAif(obj: aifSchema.Node): model.Node {
  if (obj.type === "I") {
    return new model.AtomNode({
      id: obj.nodeID,
      text: obj.text,
      metadata: new model.Metadata({
        created: date.parse(obj.timestamp, aifSchema.DATE_FORMAT),
        updated: date.parse(obj.timestamp, aifSchema.DATE_FORMAT),
      }),
    });
  } else {
    const aifType = obj.type as aifSchema.SchemeType;
    const schemeNode = new model.SchemeNode({
      id: obj.nodeID,
      metadata: new model.Metadata({
        created: date.parse(obj.timestamp, aifSchema.DATE_FORMAT),
        updated: date.parse(obj.timestamp, aifSchema.DATE_FORMAT),
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

function edgeFromAif(
  obj: aifSchema.Edge,
  nodes: { [key: string]: model.Node }
): model.Edge {
  return new model.Edge({
    id: obj.edgeID,
    source: nodes[obj.fromID],
    target: nodes[obj.toID],
  });
}
