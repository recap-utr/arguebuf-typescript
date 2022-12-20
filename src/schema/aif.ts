import * as date from "../services/date";
import * as model from "arg-services/arg_services/graph/v1/graph_pb";
import * as jsonPackage from "../../package.json";

export type NodeType = "I" | "L" | "RA" | "CA" | "MA" | "TA" | "PA" | "YA" | "";

export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";

export type ArguebufSchemeType = "support" | "attack" | "rephrase" | "preference";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

const NO_SCHEME_LABEL = "Unknown Inference";

/*
export enum ArguebufSchemeType {
  SUPPORT = "support",
  ATTACK = "attack",
  REPHRASE = "rephrase",
  PREFERENCE = "preference",
}*/

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
    nodes: Object.entries(obj.nodes).map((entry) => nodeToAif(entry[1], entry[0])),
    // nodes: obj.nodes.map((n) => nodeToAif(n)),
    edges: Object.entries(obj.edges).map((entry) => edgeToAif(entry[1], entry[0])),
    // edges: obj.edges.map((e) => edgeToAif(e)),
    locutions: [],
  };
}

/*
function nodeToAif(n: model.Node): Node {
  if (node.isAtom(n)) {
    return {
      nodeID: n.id,
      text: n.data.text,
      type: "I",
      timestamp: date.format(n.data.metadata.updated, DATE_FORMAT),
    };
  } else if (node.isScheme(n)) {
    return {
      nodeID: n.id,
      text: n.data.scheme ? n.data.scheme.value : NO_SCHEME_LABEL,
      type: n.data.scheme ? scheme2aif[n.data.scheme.type] : "",
      timestamp: date.format(n.data.metadata.updated, DATE_FORMAT),
    };
  }

  throw new Error("Node type not supported");
}*/

function nodeToAif(n: model.Node, id: string): Node {
  if (n.type.oneofKind === "atom") {
    return {
      nodeID: id,
      text: n.type.atom.text,
      type: "I",
      timestamp: date.fromProtobuf(n.metadata?.updated),
    };
  } else if (n.type.oneofKind === "scheme") {
    return {
      nodeID: id,
      text: n.type.scheme.type.oneofKind ? n.type.scheme.type.oneofKind : NO_SCHEME_LABEL,
      type: n.type.scheme.type.oneofKind ? scheme2aif[n.type.scheme.type.oneofKind] : "",
      timestamp: date.fromProtobuf(n.metadata?.updated),
    };
  }

  throw new Error("Node type not supported");
}


function edgeToAif(e: model.Edge, id: string): Edge {
  return {
    edgeID: id,
    fromID: e.source,
    toID: e.target,
    formEdgeID: null,
  };
}

/*
export function fromAif(obj: Graph): model.Graph {
  const nodes = obj.nodes
    .map((n) => nodeFromAif(n))
    .filter((n): n is node.Node => !!n);
  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = obj.edges
    .filter((e) => nodeIds.has(e.fromID) && nodeIds.has(e.toID))
    .map((e) => edgeFromAif(e));

  return model.initWrapper({
    nodes,
    edges,
  });
}
*/

export function fromAif(obj: Graph): model.Graph {
  var nodeDict: { [key: string]: model.Node } = {};
  obj.nodes.forEach((node) => nodeDict[node.nodeID] = nodeFromAif(node));
  var edgeDict: { [key: string]: model.Edge } = {};
  obj.edges.forEach((edge) => edgeDict[edge.edgeID] = edgeFromAif(edge));

  const graph: model.Graph = {
    nodes: nodeDict,
    edges: edgeDict,
    resources: {},
    participants: {},
    analysts: {},
    schemaVersion: 1,
    libraryVersion: jsonPackage.dependencies["arg-services"],
  }
  return graph;
}

/*
function nodeFromAif(obj: Node): model.Node | undefined {
  const timestamp = date.parse(obj.timestamp, DATE_FORMAT);
  const metadata: meta.Metadata = { created: timestamp, updated: timestamp };

  if (obj.type === "I") {
    const n: node.AtomNode = {
      id: obj.nodeID,
      type: "atom",
      data: {
        userdata: {},
        metadata,
        text: obj.text,
      },
      position: { x: 0, y: 0 },
    };
    return n;
  } else if (obj.type in aif2scheme) {
    const aifType = obj.type as SchemeType;
    const aifScheme: string = obj.scheme ?? obj.text;
    const type = aif2scheme[aifType];
    let scheme: node.Scheme | undefined = undefined;

    if (type) {
      switch (type) {
        case "support": {
          scheme = { type, value: node.text2support[aifScheme] ?? node.Support.DEFAULT };
          break;
        }
        case "attack": {
          scheme = { type, value: node.text2attack[aifScheme] ?? node.Attack.DEFAULT };
          break;
        }
        case "rephrase": {
          scheme = {
            type,
            value: node.text2rephrase[aifScheme] ?? node.Rephrase.DEFAULT,
          };
          break;
        }
        case "preference": {
          scheme = {
            type,
            value: node.text2preference[aifScheme] ?? node.Preference.DEFAULT,
          };
          break;
        }
      }
    }

    const n: node.SchemeNode = {
      id: obj.nodeID,
      type: "scheme",
      data: {
        userdata: {},
        metadata,
        scheme,
        premiseDescriptors: [],
      },
      position: { x: 0, y: 0 },
    };

    return n;
  }

  return undefined;
}
*/
export function nodeFromAif(obj: Node): model.Node {
  if (obj.type === "I") {
    const atomNode: model.Node = {
      type: {
        oneofKind: "atom",
        atom: {
          text: obj.text,
        },
      },
      metadata: {
        created: date.toProtobuf(obj.timestamp),
        updated: date.toProtobuf(obj.timestamp),
      },
    };
    return atomNode;
  } else {
    const aifType = obj.type as SchemeType;
    var schemeType = undefined;
    switch (aifType) {
      case "RA": {
        schemeType = {
          oneofKind: "support" as "support",
          support: model.Support.DEFAULT,
        };
        break;
      }
      case "CA": {
        schemeType = {
          oneofKind: "attack" as "attack",
          attack: model.Attack.DEFAULT,
        };
        break;
      }
      case "MA": {
        schemeType = {
          oneofKind: "rephrase" as "rephrase",
          rephrase: model.Rephrase.DEFAULT,
        };
        break;
      }
      case "PA": {
        schemeType = {
          oneofKind: "preference" as "preference",
          preference: model.Preference.DEFAULT,
        };
        break;
      }
      default: {
        schemeType = {
          oneofKind: undefined,
        };
      }
    }
    // --------------
    const scheme: model.Scheme = {
      type: schemeType,
      premiseDescriptors: [],
    };

    const schemeNode: model.Node = {
      type: {
        oneofKind: "scheme",
        scheme: scheme,
      },
      metadata: {
        created: date.toProtobuf(obj.timestamp),
        updated: date.toProtobuf(obj.timestamp),
      },
    };
    return schemeNode;
  }
}

/*
function edgeFromAif(obj: Edge): edge.Edge {
  return {
    id: obj.edgeID,
    source: obj.fromID,
    target: obj.toID,
    data: {
      metadata: meta.init({}),
      userdata: {},
    },
  };
}
*/
export function edgeFromAif(obj: Edge): model.Edge {
  return {
    source: obj.fromID,
    target: obj.toID,
    metadata: {},
  };
}
