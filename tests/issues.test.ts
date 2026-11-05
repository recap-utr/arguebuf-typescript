import malformedJson from "#data/malformed.json" with { type: "json" };
import { expect, test } from "vitest";
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
        },
        edges: {
          e1: { source: "a", target: "s1" },
          e2: { source: "s1", target: "mc" },
          e3: { source: "s1", target: "b" },
          e4: { source: "s2", target: "s3" },
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
    ["orphaned-atom", "o"],
    ["disconnected", "mc"],
    ["unreachable-major-claim", "b"],
  ]);
  expect(arguebuf.check(new arguebuf.Graph())).toStrictEqual([]);
});

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
  expect(issues.map(({ code, path }) => [code, path])).toStrictEqual([
    ["reference-mismatch", ["atoms", 1]],
    ["reference-unresolved", ["atoms", 2]],
  ]);
  expect(graph.atomNodes.mc.reference).toStrictEqual(
    new arguebuf.Reference({ text: "Cats 🐈 are the best pets", resource: "r", offset: 0 }),
  );
  expect(arguebuf.check(graph)).toStrictEqual([]);
  expect(arguebuf.outline(graph).schemes).toStrictEqual([
    { id: "s", type: "support", scheme: "Expert Opinion", premises: ["p"], conclusion: "mc" },
    { id: "x", type: "attack", scheme: undefined, premises: ["u"], conclusion: "s" },
    { id: "y", type: "support", scheme: undefined, premises: ["c"], conclusion: "mc" },
  ]);

  const failed = arguebuf.applyPatch(graph, {
    remove: ["c"],
    atoms: [{ id: "s", text: "Wrong kind" }, { id: "n" }],
    schemes: [{ id: "z", type: "support", premises: ["missing"], conclusion: "mc" }],
  });

  expect(failed.graph).toBe(graph);
  expect(failed.issues.map(({ code, path }) => [code, path])).toStrictEqual([
    ["invalid-patch", ["atoms", 0]],
    ["invalid-patch", ["atoms", 1]],
    ["unknown-element", ["schemes", 0]],
  ]);

  const edited = arguebuf.applyPatch(graph, {
    // the scheme of p is already removed together with p
    remove: ["p", "s"],
    atoms: [{ id: "c", text: "They are clean" }],
    schemes: [{ id: "y", type: "attack", scheme: "Unknown Label", premises: ["c", "u"] }],
    majorClaim: null,
  });

  expect(edited.issues.map(({ code, path }) => [code, path])).toStrictEqual([
    ["unknown-scheme", ["schemes", 0]],
  ]);
  // the scheme without premise and its undercutter are removed
  expect(Object.keys(edited.graph.nodes)).toStrictEqual(["mc", "u", "c", "y"]);
  expect(arguebuf.outline(edited.graph).schemes).toStrictEqual([
    { id: "y", type: "attack", scheme: undefined, premises: ["c", "u"], conclusion: "mc" },
  ]);
  expect(edited.graph.majorClaim).toBeUndefined();
  expect(graph.nodes.p).toBeDefined();
  expect([edited.created, edited.updated, edited.removed]).toStrictEqual([
    [],
    ["c", "y"],
    ["p", "s", "x"],
  ]);
});

test("parsePatch reports every problem of untrusted input", () => {
  expect(arguebuf.parsePatch([]).issues).toMatchObject([{ code: "invalid-patch", path: [] }]);
  const parsed = arguebuf.parsePatch({
    atoms: [{ id: "a", text: 1 }, { text: "b" }],
    schemes: [{ id: "s", type: "rebut", premises: [] }],
    majorClaim: null,
    extra: true,
  });

  expect(parsed.patch).toBeUndefined();
  expect(parsed.issues).toHaveLength(5);
  expect(parsed.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: "invalid-patch", path: ["atoms", 0, "text"] }),
      expect.objectContaining({ code: "invalid-patch", path: ["atoms", 1] }),
      expect.objectContaining({ code: "invalid-patch", path: ["schemes", 0, "type"] }),
      expect.objectContaining({ code: "invalid-patch", path: ["schemes", 0, "premises"] }),
      expect.objectContaining({ code: "invalid-patch", path: [] }),
    ]),
  );
  expect(arguebuf.parsePatch({ remove: ["a"], majorClaim: null })).toStrictEqual({
    patch: { remove: ["a"], majorClaim: null },
    issues: [],
  });
  const schema: arguebuf.JsonSchema = {
    ...arguebuf.patchSchema,
    properties: {
      ...arguebuf.patchSchema.properties,
      confidence: { type: "number", minimum: 0, maximum: 1 },
      explanations: { type: "object", additionalProperties: { type: "string" } },
    },
  };

  expect(arguebuf.parsePatch({ confidence: 2 }, schema).patch).toBeUndefined();
  expect(arguebuf.parsePatch({ confidence: 0.5 }, schema).patch).toEqual({ confidence: 0.5 });
  expect(arguebuf.parsePatch({ explanations: { "0/~": 1 } }, schema).issues[0].path).toEqual([
    "explanations",
    "0/~",
  ]);
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
});
