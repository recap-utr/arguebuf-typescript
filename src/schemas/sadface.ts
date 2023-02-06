export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
  metadata: Metadata;
  resources?: Array<any>;
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

export const DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss";

export interface SchemeNode {
  id: string;
  metadata: object;
  name: string;
  type: "scheme";
}

export interface Core {
  analyst_email?: string;
  analyst_name?: string;
  created?: string;
  description?: string;
  edited?: string;
  id?: string;
  notes?: string;
  title?: string;
  version?: string;
}

export interface Metadata {
  core: Core;
}
