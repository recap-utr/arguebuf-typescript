import { applyPatches, enablePatches, produce, produceWithPatches } from "immer";
import { expect, test } from "vitest";
import * as arguebuf from "../src/index.js";

type Custom = { atom: { label: string; embedding?: Float32Array } };

function atom(id: string) {
  return new arguebuf.AtomNode({ id, text: "" });
}

function scheme(id: string, value?: arguebuf.Scheme) {
  return new arguebuf.SchemeNode({ id, scheme: value });
}

function edges(...pairs: [string, string][]) {
  return pairs.map(([source, target]) => new arguebuf.Edge({ source, target }));
}

function ids(nodes: Iterable<arguebuf.Node>) {
  return [...nodes].map((node) => node.id).sort();
}

function generateGraph() {
  // s3 duplicates the path from a1 to a4
  return new arguebuf.Graph({
    nodes: [...["a1", "a2", "a3", "a4"].map(atom), ...["s1", "s2", "s3"].map((id) => scheme(id))],
    edges: edges(
      ["a1", "s1"],
      ["s1", "s2"],
      ["s2", "a4"],
      ["a2", "s1"],
      ["a3", "s2"],
      ["a1", "s3"],
      ["s3", "a4"],
    ),
  });
}

test("remove scheme nodes", () => {
  const graph = generateGraph();
  graph.removeSchemeNodes();

  expect(Object.keys(graph.nodes)).toHaveLength(4);
  expect(Object.keys(graph.schemeNodes)).toHaveLength(0);
  expect(Object.keys(graph.edges)).toHaveLength(3);

  // without self-loops
  const other = new arguebuf.Graph({
    nodes: [atom("a1"), scheme("s1")],
    edges: edges(["a1", "s1"], ["s1", "a1"]),
  });
  other.removeSchemeNodes();

  expect(Object.keys(other.edges)).toStrictEqual([]);
});

test("remove branch", () => {
  const graph = generateGraph();
  graph.removeBranch("s2");

  expect(ids(Object.values(graph.nodes))).toStrictEqual(["a4", "s3"]);
  expect(Object.keys(graph.edges)).toHaveLength(1);
});

test("remove empty scheme branches", () => {
  const graph = generateGraph();
  graph.addNode(scheme("s4", { case: "support", value: arguebuf.Support.DEFAULT }));
  graph.addEdge(new arguebuf.Edge({ source: "a4", target: "s4" }));
  graph.removeEmptySchemeBranches();

  expect(ids(Object.values(graph.nodes))).toStrictEqual(["a4", "s4"]);
});

test("sibling nodes", () => {
  const graph = new arguebuf.Graph({
    nodes: [
      ...["a1", "a2", "a3", "a4", "a5", "a6"].map(atom),
      ...["s1", "s2", "s3", "s4", "s5"].map((id) => scheme(id)),
    ],
    edges: edges(
      ["a1", "s1"],
      ["a2", "s2"],
      ["s1", "a3"],
      ["s2", "a3"],
      ["a3", "s3"],
      ["s3", "a4"],
      ["s4", "a4"],
      ["a5", "s4"],
      ["s5", "a5"],
      ["a6", "s5"],
    ),
  });

  expect(graph.siblingNodeDistances("a2", Infinity)).toStrictEqual(
    new Map([
      ["a1", 2],
      ["a6", 4],
    ]),
  );
  expect(graph.siblingNodes("a2")).toStrictEqual([]);
  expect(ids(graph.siblingNodes("s3"))).toStrictEqual(["s4"]);
  expect(ids(graph.siblingNodes("a1", 2, "atom"))).toStrictEqual(["a2"]);
});

test("sibling and atom queries terminate on cycles", () => {
  const graph = new arguebuf.Graph({
    nodes: [atom("a1"), atom("a2"), scheme("s1"), scheme("s2")],
    edges: edges(["a1", "s1"], ["s1", "s2"], ["s2", "s1"], ["s2", "a2"], ["a2", "s2"]),
  });

  expect(ids(graph.outgoingAtomNodes("a1"))).toStrictEqual(["a2"]);
  expect(ids(graph.incomingAtomNodes("s1"))).toStrictEqual(["a1", "a2"]);
  expect(graph.outgoingAtomNodes("a2")).toStrictEqual([]);
  expect(ids(graph.incomingAtomNodes("a2"))).toStrictEqual(["a1"]);
  expect(ids(graph.siblingNodes("a1", Infinity))).toStrictEqual(["s2"]);
});

test("adjacency and traversal", () => {
  const [n1, n2, n3] = [atom("a1"), scheme("s1"), atom("a2")];
  const graph = new arguebuf.Graph({
    nodes: [n1, n2, n3],
    edges: edges([n1.id, n2.id], [n2.id, n3.id]),
  });
  const outgoing = (node: arguebuf.Node) => graph.outgoingNodes(node);

  expect(graph.rootNode).toBe(n3);
  expect(graph.leafNodes).toStrictEqual([n1]);
  expect(graph.incomingNodes(n3)).toStrictEqual([n2]);
  expect(graph.incomingEdges(n1)).toStrictEqual([]);
  expect(graph.outgoingNodes(n1)).toStrictEqual([n2]);
  expect(graph.outgoingEdges(n3)).toStrictEqual([]);

  [n1, n2, n3].forEach((node, index) => {
    expect(arguebuf.traverse.nodeDistance(n1, node, outgoing)).toBe(index);
  });
  expect(arguebuf.traverse.nodeDistance(n3, n1, outgoing)).toBeUndefined();
  expect(arguebuf.traverse.nodeDistance(n3, n1, outgoing, Infinity, false)).toBe(2);
  expect(arguebuf.traverse.nodeDistance(n1, n3, outgoing, 1)).toBeUndefined();
  expect(arguebuf.traverse.bfs(n1, outgoing)).toStrictEqual([n1, n2, n3]);
  expect(
    arguebuf.traverse.dfs<arguebuf.Node>(n3, (node) => graph.incomingNodes(node), false),
  ).toStrictEqual([n2, n1]);

  expect(graph.schemeBetween(n1, n3)).toBe(n2);
  expect(graph.schemeBetween(n3, n1)).toBeUndefined();
  expect(graph.outgoingAtomNodes(n1)).toStrictEqual([n3]);
  expect(graph.incomingAtomNodes(n3)).toStrictEqual([n1]);
});

test("wide traversals avoid function argument limits", () => {
  const start = { id: "start" };
  const neighbors = Array.from({ length: 150_000 }, (_, index) => ({ id: String(index) }));
  const connections = (node: { id: string }) => (node === start ? neighbors : []);

  expect(arguebuf.traverse.dfs(start, connections)).toHaveLength(neighbors.length + 1);
  expect(arguebuf.traverse.bfs(start, connections)).toHaveLength(neighbors.length + 1);
});

test("draft graph with immer", () => {
  enablePatches();
  // typed arrays are not drafted, so they are replaced instead of mutated
  const embedding = new Float32Array([1, 2]);
  const node = new arguebuf.AtomNode<Custom>({ text: "A", userdata: { label: "a", embedding } });
  const other = new arguebuf.AtomNode<Custom>({ id: "b", text: "", userdata: { label: "b" } });
  const graph = new arguebuf.Graph<Custom>({ nodes: [node, other] });
  const [result, patches] = produceWithPatches(graph, (draft) => {
    const n = draft.nodes[node.id];

    if (n.type === "atom") {
      n.text = "B";
      n.userdata.label = "b";
      n.userdata.embedding = new Float32Array([3]);
    }

    draft.addNode(new arguebuf.AtomNode({ id: "new", text: "C", userdata: { label: "c" } }));
    draft.addEdge(new arguebuf.Edge({ id: "e", source: "b", target: "new" }));
    draft.majorClaim = "new";
  });

  expect(result).toBeInstanceOf(arguebuf.Graph);
  expect(result.nodes[node.id]).toBeInstanceOf(arguebuf.AtomNode);
  expect(result.nodes[node.id]).toMatchObject({ text: "B", userdata: { label: "b" } });
  expect(result.nodes[node.id].userdata.embedding).toStrictEqual(new Float32Array([3]));
  expect(Object.isFrozen(result.nodes[node.id].userdata)).toBe(true);
  expect(node.userdata).toStrictEqual({ label: "a", embedding });
  expect(result.majorClaim).toBe("new");
  expect(result.outgoingNodes("b")).toStrictEqual([result.nodes.new]);
  expect(Object.isFrozen(result.nodes)).toBe(true);
  expect(() => result.removeNode("new")).toThrow(TypeError);
  expect(graph.nodes[node.id]).toMatchObject({ text: "A" });
  expect(graph.outgoingNodes("b")).toStrictEqual([]);
  expect(Object.keys(graph.nodes)).toHaveLength(2);
  expect(applyPatches(graph, patches)).toStrictEqual(result);

  const removed = produce(result, (draft) => draft.removeNode("new"));
  expect(removed.outgoingEdges("b")).toStrictEqual([]);
  expect(result.incomingEdges("new")).toStrictEqual([result.edges.e]);
});
