import * as graph from "../model/graph";
import * as node from "../model/node";
import * as edge from "../model/edge";
import * as date from "../services/date";
import * as meta from "../model/metadata";
import * as model from "../model"


export type NodeType = "I" | "L" | "RA" | "CA" | "MA" | "TA" | "PA" | "YA" | "";

export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

const NO_SCHEME_LABEL = "Unknown Inference";

const scheme2aif: { [key in node.SchemeType]: SchemeType } = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

const aif2scheme: { [key in SchemeType]: node.SchemeType | undefined } = {
  RA: node.SchemeType.SUPPORT,
  CA: node.SchemeType.ATTACK,
  MA: node.SchemeType.REPHRASE,
  PA: node.SchemeType.PREFERENCE,
  "": undefined,
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

export function toAif(obj: model.Wrapper): Graph {
  return {
    nodes: obj.nodes.map((n) => nodeToAif(n)),
    edges: obj.edges.map((e) => edgeToAif(e)),
    locutions: [],
  };
}


function nodeToAif(n: node.Node): Node {
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
}

function edgeToAif(e: edge.Edge): Edge {
  return {
    edgeID: e.id,
    fromID: e.source,
    toID: e.target,
    formEdgeID: null,
  };
}

export function fromAif(obj: Graph): model.Wrapper {
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

function nodeFromAif(obj: Node): node.Node | undefined {
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
