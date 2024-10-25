import type { JsonObject } from "../model";

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata: Metadata;
  resources?: unknown[];
}
export interface Edge {
  id: string;
  source_id: string;
  target_id: string;
}

export type Node = AtomNode | SchemeNode;

export interface AtomNode {
  id: string;
  metadata: JsonObject;
  sources: unknown[];
  text: string;
  type: "atom";
}

export const DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss";

export interface SchemeNode {
  id: string;
  metadata: JsonObject;
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
