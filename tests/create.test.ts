import { expect, test } from "vitest";
import * as arguebuf from "#/index.js";

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

test("atom relations collapse scheme nodes", () => {
  const graph = generateGraph();

  expect(graph.atomRelations().map(({ source, target }) => [source.id, target.id])).toHaveLength(3);
  expect(Object.keys(graph.schemeNodes)).toHaveLength(3);
  expect(arguebuf.dump.graphviz(graph, { schemeNodes: false })).not.toContain('"s1"');

  // without self-loops
  const other = new arguebuf.Graph({
    nodes: [atom("a1"), scheme("s1")],
    edges: edges(["a1", "s1"], ["s1", "a1"]),
  });

  expect(other.atomRelations()).toStrictEqual([]);
});

test("remove branch", () => {
  const graph = generateGraph().draft();
  graph.removeBranch("s2");

  expect(ids(Object.values(graph.nodes))).toStrictEqual(["a4", "s3"]);
  expect(Object.keys(graph.edges)).toHaveLength(1);
});

test("remove empty scheme branches", () => {
  const graph = generateGraph().draft();
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

  expect(graph.siblingNodeDistances("a2", { maxLevels: Infinity })).toStrictEqual(
    new Map([
      [graph.nodes.a1, 2],
      [graph.nodes.a6, 4],
    ]),
  );
  expect(graph.siblingNodes("a2")).toStrictEqual([]);
  expect(ids(graph.siblingNodes("s3"))).toStrictEqual(["s4"]);
  expect(ids(graph.siblingNodes("a1", { maxLevels: 2, nodeType: "atom" }))).toStrictEqual(["a2"]);
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
  expect(ids(graph.siblingNodes("a1", { maxLevels: Infinity }))).toStrictEqual(["s2"]);
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
  expect(arguebuf.traverse.nodeDistance(n3, n1, outgoing, { directed: false })).toBe(2);
  expect(arguebuf.traverse.nodeDistance(n1, n3, outgoing, { maxDistance: 1 })).toBeUndefined();
  expect(arguebuf.traverse.bfs(n1, outgoing)).toStrictEqual([n1, n2, n3]);
  expect(
    arguebuf.traverse.dfs<arguebuf.Node>(n3, (node) => graph.incomingNodes(node), {
      includeStart: false,
    }),
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

test("edit a draft of a graph", () => {
  // elements are immutable, so they are updated through the graph
  const embedding = new Float32Array([1, 2]);
  const node = new arguebuf.AtomNode<Custom["atom"]>({ text: "A", userdata: { label: "a", embedding } });
  const other = new arguebuf.AtomNode<Custom["atom"]>({ id: "b", text: "", userdata: { label: "b" } });
  const graph = new arguebuf.Graph<Custom>({ nodes: [node, other] });
  const result = graph.draft();
  result.updateAtom(node.id, { text: "B", userdata: { label: "b", embedding: new Float32Array([3]) } });
  result.addNode(new arguebuf.AtomNode({ id: "new", text: "C", userdata: { label: "c" } }));
  result.addNode(new arguebuf.SchemeNode({ id: "s" }));
  result.connect(["b"], "s", "new");
  result.majorClaim = "new";

  expect(result.nodes[node.id]).toMatchObject({ text: "B", userdata: { label: "b" } });
  expect(result.nodes[node.id].userdata.embedding).toStrictEqual(new Float32Array([3]));
  expect(node.userdata).toStrictEqual({ label: "a", embedding });
  expect(result.majorClaim).toBe("new");
  expect(result.outgoingAtomNodes("b")).toStrictEqual([result.nodes.new]);
  expect(graph.nodes[node.id]).toMatchObject({ text: "A" });
  expect(graph.outgoingNodes("b")).toStrictEqual([]);
  expect(Object.keys(graph.nodes)).toHaveLength(2);
  expect(graph.majorClaim).toBeUndefined();

  const frozen = result.freeze();
  const removed = frozen.draft();
  removed.removeNode("s");
  expect(removed.outgoingEdges("b")).toStrictEqual([]);
  expect(frozen.incomingNodes("new")).toStrictEqual([frozen.nodes.s]);
});
