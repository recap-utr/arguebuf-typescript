import * as model from "arg-services/graph/v1/graph_pb";
import * as date from "../services/date.js";

export interface Graph {
    nodes: Array<Node>;
    edges: Array<Edge>;
    metadata: Metadata;
}
export interface Edge {
    id: string;
    source_id: string;
    target_id: string;
}

export type Node = AtomNode | SchemeNode;

export interface AtomNode {
    id: string;
    metadata: object;
    sources: Array<any>;
    text: string;
    type: "atom";
}

export interface SchemeNode {
    id: string;
    metadata: object;
    name: string;
    type: "scheme";
}

export interface Core {
    analyst_email: string;
    analyst_name: string;
    created: string;
    description: string;
    edited: string;
    id: string;
    notes: string;
    title: string;
    version: string;
}

export interface Metadata {
    core: Core;
}

export function edgeFromSadface(obj: Edge): model.Edge {
    return new model.Edge({
        source: obj.source_id,
        target: obj.target_id,
        metadata: {},
    });
}

export function edgeToSadface(e: model.Edge, id: string): Edge {
    return {
      id: id,
      source_id: e.source,
      target_id: e.target,
    };
}

export function nodeToSadface(n: model.Node, id: string): Node {
    if (n.type.case === "atom") {
      return {
        id: id,
        metadata: {},
        sources: [],
        text: n.type.value.text,
        type: "atom",
      };
    } else if (n.type.case === "scheme") {
      return {
        id: id,
        metadata: {},
        name: n.type.value.type.case === undefined? "undefined" : n.type.value.type.case,
        type: "scheme",
      };
    }
  
    throw new Error("Node type not supported");
}

export function nodeFromSadface(obj: Node): model.Node {
    let timestamp = date.toProtobuf(date.now());
    if (obj.type === "atom") {
        const atomNode = new model.Node({
        type: {
          case: "atom",
          value: {
            text: obj.text,
          },
        },
        metadata: {
          created: timestamp,
          updated: timestamp,
        },
        userdata: obj.metadata,
      });
      return atomNode;
    } else {
        var schemeType: any = {
            value: undefined,
            case: undefined,
        }
        if (obj.name === "conflict" || obj.name === "attack") {
            schemeType.value = model.Attack.DEFAULT;
            schemeType.case = "attack";
        } else if (obj.name === "support") {
            schemeType.value = model.Support.DEFAULT;
            schemeType.case = "support";
        } else if (obj.name === "rephrase") {
            schemeType.value = model.Rephrase.DEFAULT;
            schemeType.case = "rephrase";
        } else if (obj.name === "preference") {
            schemeType.value = model.Preference.DEFAULT;
            schemeType.case = "preference";
        }
        const schemeNode = new model.Node({
        type: {
          case: "scheme",
          value: {
            premiseDescriptors: [],
            type: schemeType,
          },
        },
        metadata: {
          created: timestamp,
          updated: timestamp,
        },
        userdata: obj.metadata,
      });
      return schemeNode;
    }
  }