import type { JsonObject } from "@bufbuild/protobuf";

// `scheme` is the generic type of older versions, it is refined by its name
export type NodeType = "atom" | "scheme" | "inference" | "conflict";

export interface Source {
  resource_id: string;
  text: string;
  offset?: number;
  length?: number;
}

export interface Node {
  id: string;
  type: NodeType;
  text?: string;
  name?: string;
  sources?: Source[];
  metadata?: JsonObject;
}

export interface Edge {
  id: string;
  source_id: string;
  target_id: string;
}

export interface Resource {
  id: string;
  content?: string;
  type?: string;
  metadata?: JsonObject;
}

export interface Core {
  id: string;
  version: string;
  analyst_email?: string;
  analyst_name?: string;
  created?: string;
  edited?: string;
  description?: string;
  notes?: string;
  title?: string;
}

export interface Metadata {
  core: Core;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata: Metadata;
  resources?: Resource[];
}
