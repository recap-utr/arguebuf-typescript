// import * as aif from "../schema/aif";
import type { Edge } from "./edge";
import * as edge from "./edge";
import * as graph from "./graph";
import type { AtomNode, SchemeNode } from "./node";
import * as node from "./node";

export { v1 as uuid } from "uuid";
export { init as initAnalyst } from "./analyst";
export type { Analyst } from "./analyst";
export { EdgeStyle, LayoutAlgorithm } from "./config";
export { init as initEdge } from "./edge";
export type { Edge, EdgeData } from "./edge";
export { init as initGraph } from "./graph";
export type { Graph } from "./graph";
export {
  initAtom,
  initScheme,
  isAtom,
  isScheme,
  label as nodeLabel,
  schemeMap,
  SchemeType,
} from "./node";
export type {
  AtomData,
  AtomNode,
  Node,
  NodeData,
  Scheme,
  SchemeData,
  SchemeNode,
  SchemeValue,
} from "./node";
export { init as initParticipant } from "./participant";
export type { Participant } from "./participant";
export { init as initReference } from "./reference";
export type { Reference } from "./reference";
export { init as initResource } from "./resource";
export type { Resource } from "./resource";
export { node, edge, graph };

export type OptionalElement = Element | undefined;
export type Element = AtomNode | SchemeNode | Edge;
export type Elements = Array<Element> | OptionalElement;
export type ElementType = "atom" | "scheme" | "edge" | "graph";

/*
export function toAif(obj: Wrapper): aif.Graph {
  return {
    nodes: obj.nodes.map((n) => node.toAif(n)),
    edges: obj.edges.map((e) => edge.toAif(e)),
    locutions: [],
  };
}
*/

/*
export function fromAif(obj: aif.Graph): Wrapper {
  const nodes = obj.nodes
    .map((n) => node.fromAif(n))
    .filter((n): n is Node => !!n);
  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = obj.edges
    .filter((e) => nodeIds.has(e.fromID) && nodeIds.has(e.toID))
    .map((e) => edge.fromAif(e));

  return initWrapper({
    nodes,
    edges,
  });
}
*/

// export function toProtobuf(obj: Graph): arguebuf.Graph {
//   return arguebuf.Graph.create({
//     ...graph.toProtobuf(obj.graph),
//     nodes: Object.fromEntries(obj.nodes.map((n) => [n.id, node.toProtobuf(n)])),
//     edges: Object.fromEntries(obj.edges.map((e) => [e.id, edge.toProtobuf(e)])),
//   });
// }

// export function fromProtobuf(obj: arguebuf.Graph): Graph {
//   return {
//     nodes: Object.entries(obj.nodes).map(([id, n]) => node.fromProtobuf(id, n)),
//     edges: Object.entries(obj.edges).map(([id, e]) => edge.fromProtobuf(id, e)),
//     graph: graph.fromProtobuf(obj),
//   };
// }
