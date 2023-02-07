export type RelationType =
  | "attack"
  | "support"
  | "contradictory"
  | "contrary"
  | "entails"
  | "undercut";

export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
}

export interface Node {
  type: string | undefined;
  title?: string | undefined;
  id: string;
  labelText: string | undefined;
}

export interface Edge {
  id: string;
  from: Node;
  to: Node;
  relationType: RelationType;
}
