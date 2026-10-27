import type { Graph as AifGraph, Id } from "#/schemas/aif.js";

export interface SchemeFulfillment {
  nodeID: Id;
  schemeID: Id;
}

export interface DescriptorFulfillment {
  nodeID: Id;
  descriptorID: Id;
  selectedID: Id | null;
}

export interface Aif extends AifGraph {
  schemefulfillments: SchemeFulfillment[] | null;
  descriptorfulfillments?: DescriptorFulfillment[] | null;
  cqdescriptorfulfillments?: DescriptorFulfillment[] | null;
}

export interface OvaNode {
  nodeID: Id;
  visible: boolean;
  x: number;
  y: number;
  timestamp: string;
}

export interface OvaEdge {
  fromID: Id;
  toID: Id;
  visible: boolean;
}

export interface Ova {
  firstname: string;
  surname: string;
  url: string;
  nodes: OvaNode[];
  edges: OvaEdge[];
}

export interface Text {
  txt?: string | null;
  url?: string | null;
}

export interface Graph {
  AIF: Aif;
  text?: string | Text | null;
  OVA?: Ova;
  dialog?: boolean;
}
