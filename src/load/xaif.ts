import * as model from "../model/index.js";
import * as xAifSchema from "../schemas/xaif.js";

export function xAif(obj: xAifSchema.Graph): model.Graph {
  const nodes = Object.fromEntries(
    obj.AIF.nodes.map((node) => [node.nodeID, nodeFromAif(node)]),
  );
  const edges = Object.fromEntries(
    obj.AIF.edges.map((edge) => [edge.edgeID, edgeFromAif(edge)]),
  );
  const participants = Object.fromEntries(
    obj.AIF.participants.map((participant) => [
      participant.participantID.toString(),
      participantFromAif(participant),
    ]),
  );

  return new model.Graph({
    nodes: nodes,
    edges: edges,
    participants: participants,
  });
}

function participantFromAif(obj: xAifSchema.aifParticipant) {
  return new model.Participant({
    id: obj.participantID.toString(),
    name: obj.firstname + " " + obj.surname,
  });
}

function edgeFromAif(obj: xAifSchema.aifEdge): model.Edge {
  return new model.Edge({
    id: obj.edgeID.toString(),
    source: obj.fromID,
    target: obj.toID,
  });
}

function nodeFromAif(obj: xAifSchema.aifNode): model.Node {
  if (obj.type === "I") {
    return new model.AtomNode({
      id: obj.nodeID,
      text: obj.text,
      metadata: new model.Metadata(),
    });
  } else {
    const aifType = obj.type as xAifSchema.SchemeType;
    const schemeNode = new model.SchemeNode({
      id: obj.nodeID,
      metadata: new model.Metadata(),
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
