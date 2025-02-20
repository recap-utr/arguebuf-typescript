export type NodeType = "I" | "L" | "RA" | "CA" | "MA" | "TA" | "PA" | "YA" | "";

export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";

export const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  locutions: Locution[];
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
