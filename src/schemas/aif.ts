export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";
export type DialogType = "L" | "TA" | "YA";
export type NodeType = SchemeType | DialogType | "I";
// AIFdb uses strings, xAIF tools mostly integers, loaders stringify them
export type Id = string | number;

export const DIALOG_TYPES: ReadonlySet<string> = new Set<DialogType>(["L", "TA", "YA"]);

export interface Node {
  nodeID: Id;
  text: string;
  type: NodeType;
  timestamp?: string;
  scheme?: string | null;
  schemeID?: Id;
}

export interface Edge {
  edgeID: Id;
  fromID: Id;
  toID: Id;
  formEdgeID?: Id | null;
}

export interface Locution {
  nodeID: Id;
  personID: Id;
  timestamp?: string;
  start?: string | null;
  end?: string | null;
  source?: string | null;
}

export interface Participant {
  participantID: Id;
  firstname?: string;
  surname?: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  locutions?: Locution[] | null;
  // only part of xAIF, AIFdb stores the participants separately
  participants?: Participant[] | null;
}
