import { NodeType } from "./aif.js";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

export const DATE_FORMAT_ANALYSIS = "DD/MM/YYYY";

export interface Node {
  id: number;
  x: number;
  y: number;
  color: string;
  text: string;
  type: NodeType;
  scheme: string;
  descriptors: { [key in string]: number };
  cqdesc: { [key in string]: any };
  visible: boolean;
  participantID: string;
  w: number;
  h: number;
  /*
    Specific to original OVA
    */
  imgurl?: string;
  /*
    Specific to ReCAP OVA
    */
  majorClaim?: boolean;
  is_check_worthy?: string;
  source?: string;
  text_begin?: Array<number>;
  text_end?: Array<number>;
  text_length?: Array<number>;
  comment?: string;
  annotator?: string;
  date?: string;
}

export interface Edge {
  from: Node;
  to: Node;
  visible: boolean;
  /*
    Specific to ReCAP OVA
    */
  annotator?: string;
  date?: string;
}

export interface Participant {
  id: number;
  firstname: string;
  surname: string;
}

export interface Analysis {
  txt: string;
  /*
    Specific to ReCAP OVA
    */
  plain_txt?: string;
  annotatorName?: string;
  documentSource?: string;
  documentTitle?: string;
  ovaVersion?: string;
}

export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
  participants: Array<Participant>;
  analysis: Analysis;
}
