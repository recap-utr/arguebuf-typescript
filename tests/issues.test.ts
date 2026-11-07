import malformedJson from "#data/malformed.json" with { type: "json" };
import { expect, test, vi } from "vitest";
import * as z from "zod";
import * as arguebuf from "#/index.js";

const malformed = malformedJson as arguebuf.schemas.aif.Graph;
const SOURCE = "Cats 🐈 are the best pets. They are “independent”, and they are clean.";

const codes = (issues: readonly arguebuf.Issue[]) => issues.map((issue) => issue.code);

// offsets are UTF-16 indices, so they are one higher than the code point offsets of Python after the emoji
test("locate finds verbatim, normalized, and similar spans", () => {
  expect(arguebuf.locate(SOURCE, "are the best pets")).toStrictEqual({
    offset: 8,
    text: "are the best pets",
    similarity: 1,
  });
  expect(arguebuf.locate(SOURCE, 'They are "independent".')).toMatchObject({
    offset: 27,
    text: "They are “independent",
    similarity: 1,
  });
  expect(arguebuf.locate(SOURCE, "they  are clen")).toMatchObject({
    offset: 55,
    text: "they are clean",
  });
  expect(arguebuf.locate(SOURCE, "they are", { near: 50 })?.offset).toBe(55);
  expect(arguebuf.locate(SOURCE, "dogs bark loudly")).toBeUndefined();
  expect(arguebuf.locate(SOURCE, "")).toBeUndefined();
  expect(arguebuf.locate("ACABACCB", "acaac", { near: 0, threshold: 0.8 })).toEqual({
    offset: 0,
    text: "ACABAC",
    similarity: 0.8,
  });

  for (const near of [0, 1]) {
    expect(arguebuf.locate("AAAAAA", "aaaaa", { near })?.offset).toBe(near);
    expect(arguebuf.locate("ABXDEABXDE", "abcde", { near: near * 5, threshold: 0.8 })?.offset).toBe(
      near * 5,
    );
  }
});

test("loaders repair malformed graphs and report it", () => {
  const issues: arguebuf.Issue[] = [];
  const graph = arguebuf.load.json(malformed, { onIssue: (issue) => issues.push(issue) });

  expect(codes(issues)).toStrictEqual([
    "duplicate-id",
    "parallel-edge",
    "self-loop",
    "atom-edge",
    "unknown-element",
  ]);
  expect(issues.every((issue) => issue.severity === "warning")).toBe(true);
  expect(graph.outgoingAtomNodes("4")).toStrictEqual([graph.nodes["1"]]);
  expect(codes(arguebuf.check(graph))).toStrictEqual([
    "scheme-without-premise",
    "scheme-without-conclusion",
    "untyped-scheme",
    "no-major-claim",
  ]);
  expect(() => arguebuf.load.json(malformed, { strict: true })).toThrow(arguebuf.GraphError);
});

test("check reports quality problems", () => {
  const graph = arguebuf.load
    .json(
      {
        resources: { r: { text: SOURCE } },
        participants: { p: {} },
        nodes: {
          mc: { atom: { text: "Cats are the best pets", participant: "p" } },
          a: { atom: { text: "x", reference: { text: "pets", resource: "r", offset: 1 } } },
          b: { atom: { text: "y" } },
          o: { atom: { text: "z", reference: { text: "dogs", resource: "r" } } },
          s1: { scheme: { support: "SUPPORT_DEFAULT" } },
          s2: { scheme: {} },
          s3: { scheme: { attack: "ATTACK_DEFAULT" } },
          s4: { scheme: { attack: "ATTACK_DEFAULT" } },
        },
        edges: {
          e1: { source: "a", target: "s1" },
          e2: { source: "s1", target: "mc" },
          e3: { source: "s1", target: "b" },
          e4: { source: "s2", target: "s3" },
          e5: { source: "a", target: "s4" },
          e6: { source: "b", target: "s4" },
          e7: { source: "s4", target: "b" },
        },
        majorClaim: "mc",
      },
      { onIssue: () => undefined },
    )
    .draft();
  graph.updateAtom("a", {
    reference: new arguebuf.Reference({ text: "pets", resource: "r", offset: 1 }),
  });

  expect(arguebuf.check(graph).map(({ code, elements }) => [code, elements[0]])).toStrictEqual([
    ["reference-mismatch", "a"],
    ["reference-unresolved", "o"],
    ["scheme-multiple-conclusions", "s1"],
    ["untyped-scheme", "s2"],
    ["scheme-without-premise", "s2"],
    ["scheme-without-premise", "s3"],
    ["scheme-without-conclusion", "s3"],
    ["scheme-multiple-premises", "s4"],
    ["circular-scheme", "s4"],
    ["orphaned-atom", "o"],
    ["disconnected", "mc"],
    ["unreachable-major-claim", "b"],
  ]);
  expect(arguebuf.check(new arguebuf.Graph())).toStrictEqual([]);
});

const issuePaths = (issues: readonly arguebuf.Issue[]) =>
  issues.map(({ code, path }) => [code, path]);

test("applyPatch applies patches all or nothing", () => {
  const empty = new arguebuf.Graph();
  const { graph, issues } = arguebuf.applyPatch(empty, {
    resources: [{ id: "r", text: SOURCE }],
    atoms: [
      { id: "mc", text: "Cats are the best pets." },
      { id: "p", text: "they are independant" },
      { id: "u", text: "Cats scratch furniture" },
      { id: "c", text: "they are clean" },
    ],
    schemes: [
      { id: "s", type: "support", scheme: "Expert Opinion", premises: ["p"], conclusion: "mc" },
      { id: "x", type: "attack", premises: ["u"], conclusion: "s" },
      { id: "y", type: "support", premises: ["c"], conclusion: "mc" },
    ],
    majorClaim: "mc",
  });

  expect(Object.keys(empty.nodes)).toStrictEqual([]);
  expect(issuePaths(issues)).toStrictEqual([
    ["reference-mismatch", ["atoms", 1]],
    ["reference-unresolved", ["atoms", 2]],
  ]);
  expect(graph.atomNodes.mc.reference).toStrictEqual(
    new arguebuf.Reference({ text: "Cats 🐈 are the best pets", resource: "r", offset: 0 }),
  );
  expect(arguebuf.check(graph)).toStrictEqual([]);
  expect(arguebuf.outline(graph).schemes).toStrictEqual([
    { id: "s", type: "support", scheme: "Expert Opinion", premises: ["p"], conclusion: "mc" },
    { id: "x", type: "attack", scheme: null, premises: ["u"], conclusion: "s" },
    { id: "y", type: "support", scheme: null, premises: ["c"], conclusion: "mc" },
  ]);

  const failed = arguebuf.applyPatch(graph, {
    delete: ["c"],
    atoms: [{ id: "s", text: "Wrong kind" }],
    schemes: [{ id: "z", type: "support", premises: ["missing"], conclusion: "mc" }],
  });

  expect(failed.graph).toBe(graph);
  expect(issuePaths(failed.issues)).toStrictEqual([
    ["invalid-patch", ["atoms", 0]],
    ["unknown-element", ["schemes", 0]],
  ]);

  const edited = arguebuf.applyPatch(graph, {
    // the scheme of p is already removed together with p
    delete: ["p", "s"],
    atoms: [{ id: "c", text: "They are clean" }],
    schemes: [
      { id: "y", type: "attack", scheme: "Unknown Label", premises: ["c", "u"], conclusion: "mc" },
    ],
  });

  // unknown scheme labels fall back to the default
  expect(issuePaths(edited.issues)).toStrictEqual([["unknown-scheme", ["schemes", 0]]]);
  // the scheme without premise and its undercutter are removed
  expect(Object.keys(edited.graph.nodes)).toStrictEqual(["mc", "u", "c", "y"]);
  expect(arguebuf.outline(edited.graph).schemes).toStrictEqual([
    { id: "y", type: "attack", scheme: null, premises: ["c", "u"], conclusion: "mc" },
  ]);
  expect(edited.graph.atomNodes.c.reference?.text).toBe("they are clean");
  expect(edited.graph.majorClaim).toBe("mc");
  expect(graph.nodes.p).toBeDefined();
  expect([edited.created, edited.updated, edited.removed]).toStrictEqual([
    [],
    ["c", "y"],
    ["p", "s", "x"],
  ]);
});

test("patches are validated against their schema", () => {
  const invalid: arguebuf.Patch = JSON.parse(
    '{"atoms": [{"id": "a"}], "schemes": [{"id": "s", "type": "rebut", "premises": [], "conclusion": "a"}], "extra": true}',
  );
  const { graph, issues } = arguebuf.applyPatch(new arguebuf.Graph(), invalid);

  expect(Object.keys(graph.nodes)).toStrictEqual([]);
  expect(issuePaths(issues)).toStrictEqual([
    ["invalid-patch", ["atoms", 0, "text"]],
    ["invalid-patch", ["schemes", 0, "type"]],
    ["invalid-patch", ["schemes", 0, "premises"]],
    ["invalid-patch", []],
  ]);

  const schema = z.toJSONSchema(arguebuf.patchSchema, { io: "input" });

  expect(schema.required).toBeUndefined();
  expect(schema.properties?.atoms).toMatchObject({ items: { required: ["id", "text"] } });
});

test("updating a resource text re-anchors its references", () => {
  const graph = new arguebuf.GraphDraft({
    resources: [new arguebuf.Resource({ id: "r", text: "Cats are pets." })],
    nodes: [
      new arguebuf.AtomNode({
        id: "a",
        text: "Pets",
        reference: new arguebuf.Reference({ text: "pets", resource: "r", offset: 9 }),
      }),
    ],
  });

  expect(codes(graph.updateResource("r", { text: "Indeed, cats are pets." }))).toStrictEqual([
    "reference-mismatch",
  ]);
  expect(graph.atomNodes.a.reference?.offset).toBe(17);
  expect(graph.updateResource("r", { title: "Cats" })).toStrictEqual([]);
});

test("patch results keep element namespaces separate", () => {
  const graph = new arguebuf.Graph({ resources: [new arguebuf.Resource({ id: "a", text: "" })] });
  const added = arguebuf.applyPatch(graph, { atoms: [{ id: "a", text: "Claim" }] });

  expect([added.created, added.updated, added.removed]).toEqual([["a"], [], []]);
  const edited = arguebuf.applyPatch(added.graph, { atoms: [{ id: "a", text: "Changed" }] });
  expect([edited.created, edited.updated, edited.removed]).toEqual([[], ["a"], []]);
  const removed = arguebuf.applyPatch(added.graph, { clear: true });
  expect([removed.created, removed.updated, removed.removed]).toEqual([[], [], ["a"]]);
  const cleared = arguebuf.applyPatch(added.graph, { clear: true, delete: ["a"] });
  expect([cleared.issues, cleared.removed]).toEqual([[], ["a"]]);
  const unknown = arguebuf.applyPatch(added.graph, { clear: true, delete: ["x"] });
  expect(unknown.issues).toMatchObject([{ code: "unknown-element", path: ["delete"] }]);
});

test("structurally invalid input throws invalid-input", () => {
  const invalid = (obj: string) =>
    arguebuf.catchGraphError(() => arguebuf.load.json(JSON.parse(obj)));

  expect(invalid('{"AIF": {"nodes": {}, "edges": []}}')).toMatchObject({
    code: "invalid-input",
    severity: "error",
    message: "The xAIF input is invalid: AIF.nodes: Invalid input: expected array, received object",
  });
  expect(
    invalid('{"nodes": [{"nodeID": true, "text": "A", "type": "I"}], "edges": []}'),
  ).toMatchObject({
    code: "invalid-input",
    message: "The AIF input is invalid: nodes.0.nodeID: Invalid input",
  });
  expect(invalid("null")).toMatchObject({
    code: "invalid-input",
    message: "The input is not a JSON object.",
  });
});

test("unknown node types and missing participants are repaired", () => {
  const warn = vi.fn<(issue: arguebuf.Issue) => void>();
  const aif = arguebuf.load.json(
    {
      nodes: [
        { nodeID: "a", text: "A", type: "I" },
        { nodeID: "u", text: "U", type: "XX" },
      ],
      edges: [{ edgeID: "e", fromID: "u", toID: "a" }],
    },
    { onIssue: warn },
  );
  const ova = arguebuf.load.json(
    {
      nodes: [{ id: 1, text: "A", type: "I", descriptors: {}, participantID: "p" }],
      edges: [],
      participants: [],
      analysis: {},
    },
    { onIssue: warn },
  );

  expect(Object.keys(aif.nodes)).toStrictEqual(["a"]);
  expect(Object.keys(ova.nodes)).toStrictEqual(["1"]);
  expect(warn).toHaveBeenCalledTimes(2);
  expect(warn.mock.calls[0][0]).toMatchObject({
    code: "unknown-element",
    message: "Skipping node 'u' of unknown type 'XX'.",
  });
});

test("null optional values are accepted", () => {
  const sadface = arguebuf.load.json({
    nodes: [{ id: "a", type: "atom", text: null, name: null, sources: null, metadata: null }],
    edges: [],
    resources: [{ id: "r", content: null, metadata: null }],
    metadata: { core: { version: null, title: null } },
  });
  const ova = arguebuf.load.json({
    nodes: [{ id: 1, text: "A", type: "I", descriptors: null, participantID: null }],
    edges: [],
    participants: [],
    analysis: { txt: null },
  });

  expect(Object.keys(sadface.nodes)).toStrictEqual(["a"]);
  expect(Object.keys(ova.nodes)).toStrictEqual(["1"]);
});

test("unknown argdown member types are skipped", () => {
  const warn = vi.fn<(issue: arguebuf.Issue) => void>();
  const graph = arguebuf.load.json(
    {
      statements: { A: { title: "A", members: [] }, B: { title: "B", members: [] } },
      arguments: {},
      relations: [
        {
          relationType: "support",
          from: "A",
          fromType: "unknown",
          to: "B",
          toType: "equivalence-class",
        },
      ],
    },
    { onIssue: warn },
  );

  expect(Object.keys(graph.schemeNodes)).toHaveLength(0);
  expect(warn).toHaveBeenCalledWith(expect.objectContaining({ code: "unknown-element" }));
});
