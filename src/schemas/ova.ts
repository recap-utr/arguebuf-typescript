import type { NodeType } from "./aif.js";

export interface Node {
  id: number;
  x: number;
  y: number;
  color: string;
  text: string;
  type: NodeType;
  scheme: string;
  descriptors: Record<string, number | null>;
  cqdesc: Record<string, unknown>;
  visible: boolean;
  participantID: string;
  w: number;
  h: number;
  // specific to original OVA
  imgurl?: string | null;
  // specific to ReCAP OVA
  majorClaim?: boolean | null;
  is_check_worthy?: string | null;
  source?: string | null;
  text_begin?: number[] | null;
  text_end?: number[] | null;
  text_length?: number[] | null;
  comment?: string | null;
  annotator?: string | null;
  date?: string | null;
}

export interface Edge {
  from: Node;
  to: Node;
  visible: boolean;
  // specific to ReCAP OVA
  annotator?: string | null;
  date?: string | null;
}

export interface Participant {
  id: number;
  firstname: string;
  surname: string;
}

export interface Analysis {
  txt: string;
  // specific to ReCAP OVA
  plain_txt?: string | null;
  documentDate?: string | null;
  annotatorName?: string | null;
  documentSource?: string | null;
  documentTitle?: string | null;
  ovaVersion?: string | null;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  participants: Participant[];
  analysis: Analysis;
}
