import { create } from "@bufbuild/protobuf";
import * as pb from "arg-services/graph/v1/graph_pb";
import { Temporal } from "temporal-polyfill";
import { expect, expectTypeOf, test, vi } from "vitest";
import * as arguebuf from "#/index.js";

function sampleGraph() {
  const resource = new arguebuf.Resource({ id: "r", text: "Resource" });
  const participant = new arguebuf.Participant({ id: "p", name: "Bob" });
  const claim = new arguebuf.AtomNode({
    id: "c",
    text: "Claim",
    participant: "p",
    reference: new arguebuf.Reference({ text: "Res", resource: "r", offset: 0 }),
  });
  const premise = new arguebuf.AtomNode({ id: "p1", text: "Premise" });
  const scheme = new arguebuf.SchemeNode({
    id: "s",
    scheme: { case: "support", value: arguebuf.Support.EXPERT_OPINION },
    premiseDescriptors: ["p1"],
  });

  return new arguebuf.Graph({
    resources: [resource],
    participants: [participant],
    nodes: [claim, premise, scheme],
    edges: [
      new arguebuf.Edge({ id: "e1", source: "p1", target: "s", userdata: { weight: 1 } }),
      new arguebuf.Edge({ id: "e2", source: "s", target: "c" }),
    ],
    majorClaim: "c",
  });
}

test("removals cascade", () => {
  const graph = sampleGraph().draft();
  graph.removeNode("p1");

  // the scheme left without premise is removed as well
  expect(Object.keys(graph.nodes)).toStrictEqual(["c"]);
  expect(Object.keys(graph.edges)).toStrictEqual([]);

  graph.removeNode("c");
  expect(graph.majorClaim).toBeUndefined();

  const other = sampleGraph().draft();
  other.removeResource("r");
  other.removeParticipant("p");
  expect(other.atomNodes.c.reference).toStrictEqual(new arguebuf.Reference({ text: "Res" }));
  expect(other.atomNodes.c.participant).toBeUndefined();
  expect(() => other.removeEdge("missing")).toThrow(/does not exist/);
  expect(() => other.removeAnalyst("missing")).toThrow(/does not exist/);
});

test("additions validate references", () => {
  const graph = sampleGraph().draft();

  expect(() => graph.addEdge(graph.edges.e1)).toThrow(/already exists/);
  expect(() => graph.addResource(graph.resources.r)).toThrow(/already exists/);
  expect(() => graph.addParticipant(graph.participants.p)).toThrow(/already exists/);
  expect(() => graph.addEdge(new arguebuf.Edge({ source: "c", target: "missing" }))).toThrow(
    /does not exist/,
  );
  expect(() => (graph.majorClaim = "missing")).toThrow(/does not exist/);
  expect(() => (graph.majorClaim = "s")).toThrow(/Only atom nodes/);
  expect(() => graph.addNode(new arguebuf.AtomNode({ text: "", participant: "x" }))).toThrow(
    /Participant/,
  );
  expect(() =>
    graph.addNode(
      new arguebuf.AtomNode({
        text: "",
        reference: new arguebuf.Reference({ text: "", resource: "x" }),
      }),
    ),
  ).toThrow(/Resource/);
  expect(
    () =>
      new arguebuf.Graph({
        nodes: [
          new arguebuf.AtomNode({ id: "a", text: "" }),
          new arguebuf.AtomNode({ id: "a", text: "" }),
        ],
      }),
  ).toThrow(/already exists/);
  expect(() => new arguebuf.Graph({ majorClaim: "missing" })).toThrow(/does not exist/);
});

test("prototype property names are ordinary entity ids", () => {
  const id = "__proto__";
  const graph = new arguebuf.Graph({
    resources: [new arguebuf.Resource({ id, text: "" })],
    participants: [new arguebuf.Participant({ id })],
    analysts: [new arguebuf.Analyst({ id })],
    nodes: [
      new arguebuf.AtomNode({
        id,
        text: "",
        participant: id,
        reference: new arguebuf.Reference({ text: "", resource: id }),
      }),
      new arguebuf.SchemeNode({ id: "constructor" }),
    ],
    edges: [new arguebuf.Edge({ id, source: id, target: "constructor" })],
  });

  expect(Object.keys(graph.nodes)).toStrictEqual([id, "constructor"]);
  expect(graph.incomingEdges("constructor")).toStrictEqual([graph.edges[id]]);
  expect(graph.outgoingNodes(id)).toStrictEqual([graph.nodes.constructor]);

  const removed = graph.draft();
  removed.removeParticipant(id);
  removed.removeResource(id);
  removed.removeAnalyst(id);
  removed.removeNode(id);

  expect(
    [
      removed.nodes,
      removed.edges,
      removed.resources,
      removed.participants,
      removed.analysts,
    ].flatMap(Object.keys),
  ).toStrictEqual([]);
});

test("cleanup retains only referenced resources and participants", () => {
  const graph = sampleGraph().draft();
  graph.addResource(new arguebuf.Resource({ text: "Unused" }));
  graph.addParticipant(new arguebuf.Participant());
  graph.cleanResources();
  graph.cleanParticipants();

  expect(Object.keys(graph.resources)).toStrictEqual(["r"]);
  expect(Object.keys(graph.participants)).toStrictEqual(["p"]);
});

test("node labels and colors", () => {
  const graph = sampleGraph();

  expect(graph.nodes.c.label).toBe("Claim");
  expect(graph.nodes.s.label).toBe("Support: Expert Opinion");
  expect(
    new arguebuf.SchemeNode({ scheme: { case: "attack", value: arguebuf.Attack.DEFAULT } }).label,
  ).toBe("Attack");
  expect(new arguebuf.SchemeNode().label).toBe("Unknown");
  expect(graph.nodes.s.color(false, false).bg).toBe("#4CAF50");
  expect(graph.nodes.c.color(true, false).bg).toBe("#0D47A1");
});

test("metadata describes a single instant", () => {
  const metadata = new arguebuf.Metadata();
  expect(metadata.updated).toBe(metadata.created);

  const created = Temporal.Instant.from("1970-01-01T00:00Z");
  expect(new arguebuf.Metadata({ created }).updated).toBe(created);
});

test("resolve schemes", () => {
  expectTypeOf<arguebuf.Scheme>().toEqualTypeOf<Readonly<pb.Scheme["type"]>>();
  expect(arguebuf.resolveScheme("support", "ExpertOpinion")).toStrictEqual({
    case: "support",
    value: arguebuf.Support.EXPERT_OPINION,
  });
  expect(arguebuf.resolveScheme("support", "From-analogy")).toStrictEqual({
    case: "support",
    value: arguebuf.Support.ANALOGY,
  });
  expect(arguebuf.resolveScheme("support", "Unknown Scheme").value).toBe(arguebuf.Support.DEFAULT);
  expect(arguebuf.resolveAifScheme("CA", "Default Conflict")).toStrictEqual({
    case: "attack",
    value: arguebuf.Attack.DEFAULT,
  });
  expect(arguebuf.resolveAifScheme("", "")).toStrictEqual({ case: undefined });
});

test("dates are parsed and formatted in UTC", () => {
  const value = Temporal.Instant.from("2019-03-23T15:57:30Z");

  expect(arguebuf.date.parseAif("2019-03-23 15:57:30")).toStrictEqual(value);
  expect(arguebuf.date.parseAif("2019-3-23 15:57:30")).toStrictEqual(value);
  expect(arguebuf.date.parseIso("2019-03-23T16:57:30+01:00")).toStrictEqual(value);
  expect(arguebuf.date.parseIso("2019-03-23T15:57:30")).toStrictEqual(value);
  expect(arguebuf.date.parseIso("2019-03-23T15:57:30Z[Europe/Berlin]")).toStrictEqual(value);
  expect(arguebuf.date.parseOva("23/03/2019 - 15:57:30")).toStrictEqual(value);
  expect(arguebuf.date.parseOva("23/3/2019 - 15:57:30")).toStrictEqual(value);
  expect(arguebuf.date.parseOvaDate("1/2/2019")).toStrictEqual(
    Temporal.Instant.from("2019-02-01T00:00Z"),
  );
  expect(arguebuf.date.formatAif(value)).toBe("2019-03-23 15:57:30");
  expect(arguebuf.date.parseAif(undefined)).toBeUndefined();
  expect(arguebuf.date.parseOva("")).toBeUndefined();

  for (const [parse, text] of [
    [arguebuf.date.parseAif, "2019-13-01 00:00:00"],
    [arguebuf.date.parseAif, "2019-03-23T15:57:30"],
    [arguebuf.date.parseIso, "yesterday"],
    [arguebuf.date.parseOva, "23/03/2019"],
    [arguebuf.date.parseOvaDate, "23/03/2019 - 15:57:30"],
  ] as const) {
    expect(() => parse(text)).toThrow(RangeError);
  }
});

test("instants survive drafts and the protobuf round trip", () => {
  const graph = sampleGraph();
  const created = Temporal.Instant.from("1969-12-31T23:59:59.123456789Z");
  const draft = graph.draft();
  draft.metadata = new arguebuf.Metadata({ created });
  draft.updateResource("r", { timestamp: created });
  const result = draft.freeze();

  expect(result.metadata.created).toBe(created);
  expect(result.resources.r.timestamp).toBe(created);
  expect(graph.metadata.created).not.toBe(created);
  expect(arguebuf.date.toProtobuf(created)).toMatchObject({ seconds: -1n, nanos: 123456789 });
});

test("graphs, elements, and plain userdata are frozen", () => {
  const graph = sampleGraph();
  const edge = graph.edges.e1 as arguebuf.Edge<{ weight: number }>;

  expect(Object.isFrozen(graph)).toBe(true);
  expect(Object.isFrozen(graph.nodes)).toBe(true);
  expect(Object.isFrozen(graph.nodes.s)).toBe(true);
  expect(() => (edge.userdata.weight = 2)).toThrow(TypeError);
  expect(() => graph.draft().freeze().draft().addNode(graph.nodes.c)).toThrow(/already exists/);
});

test("protobuf dump writes the library version", () => {
  expect(arguebuf.dump.protobuf(sampleGraph()).libraryVersion).toMatch(
    /^arguebuf-typescript:\d+\.\d+\.\d+/,
  );
});

test("protobuf load skips dangling references with a warning", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const message = arguebuf.dump.protobuf(sampleGraph());
  message.edges.dangling = create(pb.EdgeSchema, { source: "c", target: "missing" });
  message.majorClaim = "missing";
  message.resources = {};
  message.participants = {};
  const graph = arguebuf.load.protobuf(message);

  expect(Object.keys(graph.edges)).toStrictEqual(["e1", "e2"]);
  expect(graph.majorClaim).toBeUndefined();
  expect(graph.atomNodes.c.participant).toBeUndefined();
  expect(graph.atomNodes.c.reference).toStrictEqual(new arguebuf.Reference({ text: "Res" }));
  expect(warn).toHaveBeenCalledTimes(4);
  warn.mockRestore();
});

test("offsets are UTF-16 indices in memory and code points when serialized", () => {
  const graph = new arguebuf.Graph({
    resources: [new arguebuf.Resource({ id: "r", text: "\u{1f408} Cats" })],
    nodes: [
      new arguebuf.AtomNode({
        id: "a",
        text: "Cats",
        reference: new arguebuf.Reference({ text: "Cats", resource: "r", offset: 3 }),
      }),
    ],
  });
  const json = arguebuf.dump.json(graph);

  expect(json.nodes?.a.atom?.reference?.offset).toBe(2);
  expect(arguebuf.load.json(json).atomNodes.a.reference?.offset).toBe(3);
});

test("drafts never change the graph they start from or the graphs they froze", () => {
  const graph = sampleGraph();
  const draft = graph.draft();
  const snapshot = (g: arguebuf.GraphView) =>
    JSON.stringify([
      Object.keys(g.nodes),
      Object.keys(g.edges),
      Object.keys(g.resources),
      Object.keys(g.participants),
      Object.values(g.nodes).map((node) => [g.incomingEdges(node), g.outgoingEdges(node)]),
    ]);
  const before = snapshot(graph);

  draft.removeEdge("e1");
  draft.addEdge(new arguebuf.Edge({ id: "e3", source: "p1", target: "s" }));
  draft.removeParticipant("p");
  expect(snapshot(graph)).toBe(before);

  const frozen = draft.freeze();
  const after = snapshot(frozen);
  draft.removeNode("s");
  draft.removeResource("r");
  draft.addNode(new arguebuf.AtomNode({ id: "x", text: "" }));
  expect(snapshot(frozen)).toBe(after);
  expect(draft.incomingEdges("c")).toStrictEqual([]);
  expect(frozen.incomingNodes("s")).toStrictEqual([frozen.nodes.p1]);

  // unchanged elements are shared, updates are validated and replace them
  const edited = graph.draft();
  edited.updateAtom("c", { text: "Changed" });
  expect(graph.atomNodes.c.text).not.toBe("Changed");
  expect(edited.atomNodes.c.metadata.updated).not.toBe(graph.atomNodes.c.metadata.updated);
  expect(edited.resources.r).toBe(graph.resources.r);
  expect(() => edited.updateAtom("c", { participant: "missing" })).toThrow(arguebuf.GraphError);
  expect(() => edited.updateAtom("s", { text: "Scheme" })).toThrow(arguebuf.GraphError);
});

test("batch removals and links", () => {
  const graph = sampleGraph().draft();

  expect(() => graph.removeElements(["p1", "missing"])).toThrow(arguebuf.GraphError);
  expect(Object.keys(graph.nodes)).toContain("p1");

  // the scheme is removed by the cascade before its turn, all removed ids are returned
  expect(graph.removeElements(["p1", "s", "r"]).toSorted()).toStrictEqual(
    ["e1", "e2", "p1", "r", "s"],
  );
  expect(Object.keys(graph.nodes)).toStrictEqual(["c"]);
  expect(Object.keys(graph.resources)).toStrictEqual([]);

  graph.addNode(new arguebuf.AtomNode({ id: "a", text: "" }));
  expect(graph.checkLink("a", "a")?.code).toBe("self-loop");
  expect(() => graph.link("a", "a")).toThrow(arguebuf.GraphError);
  expect(graph.checkLink("a", "c")).toBeUndefined();
  const scheme = graph.link("a", "c", { scheme: arguebuf.defaultScheme("attack") });
  expect(scheme?.scheme.case).toBe("attack");
  expect(graph.outgoingAtomNodes("a")).toStrictEqual([graph.nodes.c]);
  graph.addNode(new arguebuf.AtomNode({ id: "b", text: "" }));
  expect(scheme && graph.checkLink("a", scheme)?.code).toBe("parallel-edge");
  expect(scheme && graph.link("b", scheme)).toBeUndefined();
  expect(scheme && graph.premiseNodes(scheme)).toStrictEqual([graph.nodes.a, graph.nodes.b]);
});

test("annotations of a resource", () => {
  const graph = sampleGraph().draft();
  graph.addNode(
    new arguebuf.AtomNode({
      id: "a",
      text: "",
      reference: new arguebuf.Reference({ text: "our", resource: "r", offset: 3 }),
    }),
  );
  graph.addNode(
    new arguebuf.AtomNode({
      id: "b",
      text: "",
      reference: new arguebuf.Reference({ text: "moved", resource: "r", offset: 2 }),
    }),
  );

  expect(
    graph.annotations("r").map(({ node, start, end }) => [node.id, start, end]),
  ).toStrictEqual([
    ["c", 0, 3],
    ["a", 3, 6],
  ]);
});
