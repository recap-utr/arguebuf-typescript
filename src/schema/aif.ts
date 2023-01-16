import * as model from "arg-services/graph/v1/graph_pb";
import * as jsonPackage from "../../package.json";
import * as date from "../services/date.js";

export type NodeType = "I" | "L" | "RA" | "CA" | "MA" | "TA" | "PA" | "YA" | "";

export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";

export type ArguebufSchemeType =
  | "support"
  | "attack"
  | "rephrase"
  | "preference";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

const NO_SCHEME_LABEL = "Unknown Inference";

const scheme2aif: { [key in ArguebufSchemeType]: SchemeType } = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
  locutions: Array<Locution>;
}

export interface Node {
  nodeID: string;
  text: string;
  type: NodeType;
  timestamp: string;
  scheme?: string;
}

export interface Edge {
  edgeID: string;
  fromID: string;
  toID: string;
  formEdgeID: null;
}

export interface Locution {
  nodeID: string;
  personID: string;
  timestamp: string;
  start?: string;
  end?: string;
  source?: string;
}

export function toAif(obj: model.Graph): Graph {
  return {
    nodes: Object.entries(obj.nodes).map((entry) =>
      nodeToAif(entry[1], entry[0])
    ),
    // nodes: obj.nodes.map((n) => nodeToAif(n)),
    edges: Object.entries(obj.edges).map((entry) =>
      edgeToAif(entry[1], entry[0])
    ),
    // edges: obj.edges.map((e) => edgeToAif(e)),
    locutions: [],
  };
}

export function nodeToAif(n: model.Node, id: string): Node {
  if (n.type.case === "atom") {
    return {
      nodeID: id,
      text: n.type.value.text,
      type: "I",
      timestamp: date.fromProtobuf(n.metadata?.updated),
    };
  } else if (n.type.case === "scheme") {
    return {
      nodeID: id,
      text: n.type.value.type.case ? n.type.value.type.case : NO_SCHEME_LABEL,
      type: n.type.value.type.case ? scheme2aif[n.type.value.type.case] : "",
      timestamp: date.fromProtobuf(n.metadata?.updated),
    };
  }

  throw new Error("Node type not supported");
}

export function edgeToAif(e: model.Edge, id: string): Edge {
  return {
    edgeID: id,
    fromID: e.source,
    toID: e.target,
    formEdgeID: null,
  };
}

export function fromAif(obj: Graph): model.Graph {
  var nodeDict: { [key: string]: model.Node } = {};
  obj.nodes.forEach((node) => (nodeDict[node.nodeID] = nodeFromAif(node)));
  var edgeDict: { [key: string]: model.Edge } = {};
  obj.edges.forEach((edge) => (edgeDict[edge.edgeID] = edgeFromAif(edge)));

  return new model.Graph({
    nodes: nodeDict,
    edges: edgeDict,
    resources: {},
    participants: {},
    analysts: {},
    schemaVersion: 1,
    libraryVersion: jsonPackage.default.dependencies["arg-services"],
  });
}

export function nodeFromAif(obj: Node): model.Node {
  if (obj.type === "I") {
    const atomNode = new model.Node({
      type: {
        case: "atom",
        value: {
          text: obj.text,
        },
      },
      metadata: {
        created: date.toProtobuf(obj.timestamp),
        updated: date.toProtobuf(obj.timestamp),
      },
    });
    return atomNode;
  } else {
    const aifType = obj.type as SchemeType;
    const scheme = new model.Scheme({ premiseDescriptors: [] });

    switch (aifType) {
      case "RA": {
        scheme.type = {
          case: "support",
          value: model.Support.DEFAULT,
        };
        break;
      }
      case "CA": {
        scheme.type = {
          case: "attack",
          value: model.Attack.DEFAULT,
        };
        break;
      }
      case "MA": {
        scheme.type = {
          case: "rephrase",
          value: model.Rephrase.DEFAULT,
        };
        break;
      }
      case "PA": {
        scheme.type = {
          case: "preference",
          value: model.Preference.DEFAULT,
        };
        break;
      }
    }
    // --------------
    const schemeNode = new model.Node({
      type: {
        case: "scheme",
        value: scheme,
      },
      metadata: {
        created: date.toProtobuf(obj.timestamp),
        updated: date.toProtobuf(obj.timestamp),
      },
    });
    return schemeNode;
  }
}

export function edgeFromAif(obj: Edge): model.Edge {
  return new model.Edge({
    source: obj.fromID,
    target: obj.toID,
    metadata: {},
  });
}
