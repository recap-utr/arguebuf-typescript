import type { NodeType } from "./aif.js";
export type { NodeType, SchemeType } from "./aif.js";

export interface Graph {
  AIF: Aif;
  OVA: Ova;
  text: string;
  // dialog: boolean;
}

export interface Ova {
  firstname: string;
  surname: string;
  url: string;
  nodes: Array<OvaNode>;
  edges: Array<OvaEdge>;
}

export interface Aif {
  nodes: Array<AifNode>;
  edges: Array<AifEdge>;
  schemefulfillments: Array<AifSchemeFulfillment>;
  locutions: Array<AifLocution>;
  participants: Array<AifParticipant>;
}

export interface AifNode {
  nodeID: string;
  text: string;
  type: NodeType;
}

export interface AifEdge {
  edgeID: string | number;
  fromID: string;
  toID: string;
}

export interface AifSchemeFulfillment {
  nodeID: string;
  schemeID: string;
}

export interface AifLocution {
  nodeID: string;
  personID: number;
}

export interface AifParticipant {
  participantID: number;
  firstname: string;
  surname: string;
}

export interface OvaNode {
  nodeID: string;
  visible: boolean;
  x: number;
  y: number;
  timestamp: string;
}

export interface OvaEdge {
  fromID: string;
  toID: string;
  visible: boolean;
}
