import { Temporal } from "temporal-polyfill";
import { assertType, expect, test } from "vitest";
import aifGraph from "#data/arguebase/microtexts/format=aif,lang=en/nodeset6361.json" with { type: "json" };
import * as arguebuf from "#/index.js";
import original from "#data/dialog-original.json" with { type: "json" };
import reconstructed from "#data/dialog-reconstructed.json" with { type: "json" };

test("graph: aif2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.aif(aifGraph as arguebuf.schemas.aif.Graph);

  // Test some graph properties
  assertType<arguebuf.Graph>(arguebufGraph);
  expect(Object.keys(arguebufGraph.resources)).toStrictEqual([]);
  expect(Object.keys(arguebufGraph.analysts)).toStrictEqual([]);
  expect(arguebufGraph.metadata).not.toStrictEqual({});

  // Test a specific node in the graph
  const n1: arguebuf.Node = arguebufGraph.nodes["119928"];
  expect(n1).toMatchObject({
    type: "atom",
    text: "Three different bin bags stink away in the kitchen and have to be sorted into different wheelie bins.",
  });
  const comparisonDate = Temporal.Instant.from("2015-12-14T12:09:14Z");
  expect(n1.metadata.created).toStrictEqual(comparisonDate);
  expect(n1.metadata.updated).toStrictEqual(comparisonDate);

  // Test a specific Edge in the graph
  const e1: arguebuf.Edge = arguebufGraph.edges["160911"];
  expect(e1.source).toStrictEqual("119934");
  expect(e1.target).toStrictEqual("119932");
  expect(e1.metadata).not.toStrictEqual({});
});

// The following tests mirror tests/test_aif.py of arguebuf-python.

function relations(graph: arguebuf.GraphView): string[] {
  const ids = (nodes: readonly arguebuf.Node[]) =>
    nodes
      .map((node) => node.id)
      .sort()
      .join(",");

  return Object.values(graph.schemeNodes)
    .map((node) =>
      [node.label, ids(graph.incomingAtomNodes(node)), ids(graph.outgoingAtomNodes(node))].join(
        "|",
      ),
    )
    .sort();
}

test("reconstruct dialog", () => {
  const graph = arguebuf.load.json(original as arguebuf.schemas.aif.Graph, {
    reconstructDialog: true,
  });
  const expected = arguebuf.load.json(reconstructed as arguebuf.schemas.aif.Graph);

  expect(Object.keys(graph.atomNodes).sort()).toStrictEqual(Object.keys(expected.atomNodes).sort());
  expect(relations(graph)).toStrictEqual(relations(expected));
});

test("dialog xaif", () => {
  const node = (id: number, type: arguebuf.schemas.aif.NodeType, text = "") => ({
    nodeID: id,
    text: text || `${type}${id}`,
    type,
  });
  const edge = (id: number, source: number, target: number) => ({
    edgeID: id,
    fromID: source,
    toID: target,
  });

  // L0 (Bob) asserts I1, L3 (Alice) asserts I4, both are linked by TA6
  const obj: arguebuf.schemas.xaif.Graph = {
    AIF: {
      nodes: [
        node(0, "L", "Hello"),
        node(1, "I"),
        node(2, "YA"),
        node(3, "L", "Hi"),
        node(4, "I"),
        node(5, "YA"),
        node(6, "TA"),
      ],
      edges: [
        edge(0, 0, 2),
        edge(1, 2, 1),
        edge(2, 3, 5),
        edge(3, 5, 4),
        edge(4, 0, 6),
        edge(5, 6, 3),
      ],
      locutions: [
        { nodeID: 0, personID: 0 },
        { nodeID: 3, personID: 1 },
      ],
      schemefulfillments: null,
      descriptorfulfillments: null,
      participants: [{ participantID: 0, firstname: "Bob", surname: "Smith" }],
    },
    text: { txt: "" },
    dialog: true,
  };

  let graph = arguebuf.load.json(obj);

  expect(Object.keys(graph.edges)).toStrictEqual([]);

  // participant 1 is not listed, so its name is unknown
  for (const [id, name, text] of [
    ["1", "Bob Smith", "Hello"],
    ["4", undefined, "Hi"],
  ]) {
    const atom = graph.atomNodes[id ?? ""];

    expect(graph.participants[atom.participant ?? ""].name).toBe(name);
    expect(atom.reference?.text).toBe(text);
  }

  graph = arguebuf.load.json(obj, { reconstructDialog: true });

  expect(relations(graph)).toStrictEqual(["Rephrase|1|4"]);
});

test.each(["aif", "xaif"] as const)("roundtrip %s", (format) => {
  const timestamp = Temporal.Instant.from("2020-01-02T03:04:05Z");
  const graph = new arguebuf.GraphDraft();
  const claim = new arguebuf.AtomNode({
    text: "Claim",
    metadata: new arguebuf.Metadata({ created: timestamp }),
  });
  graph.addNode(claim);
  const schemes: arguebuf.Scheme[] = [
    ...Object.values(arguebuf.Support)
      .filter((value) => typeof value === "number")
      .map((value) => ({ case: "support" as const, value })),
    { case: "attack", value: arguebuf.Attack.DEFAULT },
    { case: "rephrase", value: arguebuf.Rephrase.DEFAULT },
    { case: "preference", value: arguebuf.Preference.DEFAULT },
  ];

  for (const scheme of schemes) {
    const node = new arguebuf.SchemeNode({ scheme });
    const premise = new arguebuf.AtomNode({ text: node.label });
    graph.addNode(premise);
    graph.addNode(node);
    graph.addEdge(new arguebuf.Edge({ source: premise.id, target: node.id }));
    graph.addEdge(new arguebuf.Edge({ source: node.id, target: claim.id }));
  }

  const loaded = arguebuf.load.json(arguebuf.dump.json(graph, format));

  expect(relations(loaded)).toStrictEqual(relations(graph));
  expect(Object.keys(loaded.edges)).toStrictEqual(Object.keys(graph.edges));
  // only AIF stores timestamps
  expect(loaded.nodes[claim.id].metadata.created.equals(timestamp)).toBe(format === "aif");
});

test("ambiguous locutions", () => {
  const node = (id: number, type: arguebuf.schemas.aif.NodeType) => ({
    nodeID: id,
    text: `${type}${id}`,
    type,
  });
  const edge = (source: number, target: number) => ({
    edgeID: `${source}-${target}`,
    fromID: source,
    toID: target,
  });

  // I0 is asserted by L1 and L2 of different persons, I3 by L4 and L5 of one person,
  // I10 by L11 with two locutions of different persons
  const graph = arguebuf.load.json({
    nodes: [
      ...(["I", "L", "L", "I", "L", "L"] as const).map((type, id) => node(id, type)),
      ...[6, 7, 8, 9, 12].map((id) => node(id, "YA")),
      node(10, "I"),
      node(11, "L"),
    ],
    edges: [
      ...[
        [1, 6],
        [2, 7],
        [4, 8],
        [5, 9],
        [11, 12],
      ].map(([source, ya]) => edge(source, ya)),
      ...[
        [6, 0],
        [7, 0],
        [8, 3],
        [9, 3],
        [12, 10],
      ].map(([ya, atom]) => edge(ya, atom)),
    ],
    locutions: [
      [1, "a"],
      [2, "b"],
      [4, "a"],
      [5, "a"],
      [11, "a"],
      [11, "b"],
    ].map(([nodeID, personID]) => ({ nodeID, personID })),
  });

  expect(graph.atomNodes["0"].participant).toBeUndefined();
  expect(graph.atomNodes["3"].participant).toBe("a");
  expect(graph.atomNodes["0"].reference).toBeUndefined();
  expect(graph.atomNodes["3"].reference).toBeUndefined();
  expect(graph.atomNodes["10"].participant).toBeUndefined();
  expect(graph.atomNodes["10"].reference?.text).toBe("L11");
});

test("xaif resources and participants", () => {
  const graph = new arguebuf.Graph({
    resources: [new arguebuf.Resource({ text: "a < b &\nc" })],
    participants: [new arguebuf.Participant({ name: "Bob van Smith" })],
  });
  const xaif = arguebuf.dump.xaif(graph);
  const loaded = arguebuf.load.json(xaif);

  expect(Object.values(loaded.resources).map((r) => r.text)).toStrictEqual(["a < b &\nc"]);
  expect(Object.values(loaded.participants).map((p) => p.name)).toStrictEqual(["Bob van Smith"]);
  expect(xaif.AIF.participants).toStrictEqual([
    { participantID: Object.keys(graph.participants)[0], firstname: "Bob", surname: "van Smith" },
  ]);
});
