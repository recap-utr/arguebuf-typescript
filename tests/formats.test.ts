// Regression tests for the format loaders and dumpers, mirroring tests/test_formats.py of arguebuf-python.
import { Temporal } from "temporal-polyfill";
import { expect, test, vi } from "vitest";
import { dumpGraphology } from "../src/graphology.js";
import * as arguebuf from "../src/index.js";
import { newReference, stringId } from "../src/load/helpers.js";
import { parseHtml } from "../src/load/html.js";

const KIALO = `Discussion Title: Title

1. Claim
1.1. Pro: -> See 1.2.
1.2. Con: Second
continued\x20\x20

1.2.1. Pro: -> See 1.1.
1.2.1.1. Con: Child of a reference
1.3. Pro: [Link](https://x.org/a_(b)) \\(c\\)
`;

function edges(graph: arguebuf.Graph): string[] {
  return Object.values(graph.edges).map((edge) => `${edge.source} -> ${edge.target}`);
}

function labels(graph: arguebuf.Graph): Record<string, string> {
  return Object.fromEntries(Object.values(graph.schemeNodes).map((node) => [node.id, node.label]));
}

test("kialo", () => {
  const graph = arguebuf.load.kialo(KIALO);

  expect(graph.name).toBe("Title");
  expect(graph.majorClaim).toBe("1.");
  expect(Object.keys(graph.atomNodes)).toStrictEqual(["1.", "1.2.", "1.2.1.1.", "1.3."]);
  expect(graph.nodes["1.2."]).toMatchObject({ text: "Second\ncontinued" });
  expect(graph.nodes["1.3."]).toMatchObject({ text: "Link (c)" });
  // forward reference and the children of a reference
  expect(edges(graph)).toContain("1.2. -> 1.1.scheme");
  expect(edges(graph)).toContain("1.2.1.scheme -> 1.2.");
  expect(edges(graph)).toContain("1.2.1.1.scheme -> 1.2.");
  expect(() => arguebuf.load.kialo(`${KIALO}1.2. Pro: Duplicate\n`)).toThrow("not unique");
  expect(arguebuf.load.kialo(KIALO, { name: "Other" }).name).toBe("Title");
  expect(
    arguebuf.load.kialo(KIALO.replace("Discussion Title: Title", ""), { name: "Other" }).name,
  ).toBe("Other");
});

test("brat", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const graph = arguebuf.load.brat(
    'T1\tMajorClaim 0 1\t"first"\n' +
      "\n" +
      "T2\tMajorClaim 2 3\tsecond\n" +
      "T3\tPremise 4 5\tpremise\n" +
      "A1\tStance T3 Against\n" +
      "R1\tsupports Arg1:T3 Arg2:T2\t\n" +
      "R2\tattacks Arg2:T1 Arg1:T3\n" +
      "garbage\n" +
      "A2\tStance T3 Neutral\n" +
      "R3\tcontradicts Arg1:T3 Arg2:T2\n",
  );

  expect(graph.nodes[graph.majorClaim ?? ""]).toMatchObject({ text: '"first"' });
  expect(labels(graph)).toStrictEqual({
    T2scheme: "Rephrase",
    A1: "Attack",
    R1: "Support",
    R2: "Attack",
  });
  expect(edges(graph)).toContain("T2scheme -> T1");
  expect(edges(graph)).toContain("A1 -> T1");
  expect(edges(graph)).toContain("R1 -> T2");
  expect(edges(graph)).toContain("T3 -> R2");
  expect(edges(graph)).toContain("R2 -> T1");
  expect(warn).toHaveBeenCalledTimes(2);
  warn.mockRestore();
});

test("sadface", () => {
  const graph = arguebuf.load.json({
    metadata: { core: { id: "g", version: "0.5" } },
    resources: [{ id: "r", content: "Text A", type: "text" }],
    nodes: [
      {
        id: "a",
        type: "atom",
        text: "A",
        sources: [{ resource_id: "r", text: "A", offset: 5 }],
      },
      { id: "b", type: "atom", text: "B" },
      { id: "i", type: "inference", name: "Expert Opinion" },
      { id: "c", type: "conflict", name: "disagree" },
      { id: "s", type: "scheme", name: "conflict" },
    ],
    edges: [{ id: "e", source_id: "a", target_id: "i" }],
  });

  expect(labels(graph)).toStrictEqual({ i: "Support: Expert Opinion", c: "Attack", s: "Attack" });
  expect(graph.nodes.a).toMatchObject({ reference: { text: "A", resource: "r", offset: 5 } });
  expect(graph.userdata).toStrictEqual({ sadfaceVersion: "0.5" });
  expect(Object.keys(graph.analysts)).toHaveLength(0);
});

test("ova", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const node = (
    id: number,
    type: arguebuf.schemas.aif.NodeType,
    text: string,
    fields: Partial<arguebuf.schemas.ova.Node> = {},
  ): arguebuf.schemas.ova.Node => ({
    id,
    type,
    text,
    descriptors: {},
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    color: "",
    scheme: "",
    cqdesc: {},
    visible: true,
    participantID: "",
    ...fields,
  });
  const claim = node(1, "I", "A & B", {
    majorClaim: true,
    date: "23/03/2019 - 15:57:30",
    participantID: "7",
  });
  const premise = node(2, "I", "C");
  const scheme = node(3, "RA", "ExpertOpinion", {
    descriptors: { "s_Conclusion։ x": 1, "s_Premise։ y": 2, "s_Other։ z": null },
  });
  const locution = node(4, "L", "Bob: C");
  const obj: arguebuf.schemas.ova.Graph = {
    nodes: [claim, premise, scheme, locution],
    edges: [
      { from: premise, to: scheme, visible: true },
      { from: scheme, to: claim, visible: true },
      { from: locution, to: premise, visible: true },
    ],
    participants: [{ id: 7, firstname: "Bob", surname: "Smith" }],
    analysis: {
      txt: '  \u{1f600}<span id="node1">A &amp; B</span><br><span id="node2">C</span>',
      plain_txt: "differs",
      annotatorName: "",
      documentDate: "01/02/2020",
    },
  };
  const graph = arguebuf.load.json(obj);
  const [resource] = Object.values(graph.resources);

  expect(resource.text).toBe("  \u{1f600}A & B\nC");
  expect(resource.timestamp).toStrictEqual(Temporal.Instant.from("2020-02-01T00:00:00Z"));
  expect(resource.title).toBeUndefined();

  for (const atom of Object.values(graph.atomNodes)) {
    const offset = atom.reference?.offset ?? -1;

    expect(
      Array.from(resource.text)
        .slice(offset)
        .join("")
        .startsWith(atom.reference?.text ?? "-"),
    ).toBe(true);
  }

  expect(graph.majorClaim).toBe("1");
  expect(graph.atomNodes["1"].participant).toBe("7");
  expect(graph.atomNodes["1"].reference).toMatchObject({ text: "A & B", offset: 3 });
  expect(graph.atomNodes["2"].participant).toBeUndefined();
  expect(graph.nodes["1"].metadata.created).toStrictEqual(
    Temporal.Instant.from("2019-03-23T15:57:30Z"),
  );
  expect(graph.schemeNodes["3"].premiseDescriptors).toStrictEqual(["2"]);
  expect(graph.schemeNodes["3"].label).toBe("Support: Expert Opinion");
  expect(Object.keys(graph.edges)).toHaveLength(2);
  expect(Object.keys(graph.analysts)).toHaveLength(0);
  expect(Object.values(graph.participants).map((p) => p.name)).toStrictEqual(["Bob Smith"]);
  const dangling = arguebuf.load.ova({
    ...obj,
    nodes: [{ ...claim, participantID: "missing" }],
  });

  expect(dangling.atomNodes["1"].participant).toBeUndefined();
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("unknown participant 'missing'"));
  warn.mockRestore();
});

test("numeric ids", () => {
  for (const value of [Number.MIN_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER]) {
    expect(stringId(value)).toBe(String(value));
  }

  expect(stringId("9007199254740992")).toBe("9007199254740992");

  for (const value of [Number.MIN_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER + 1, 1e21, 1.5]) {
    expect(() => stringId(value)).toThrow("safe integer");
  }
});

test("json argdown", () => {
  const graph = arguebuf.load.json(
    { statements: {}, arguments: {}, relations: [], frontMatter: null },
    { name: "name" },
  );

  expect(graph.name).toBe("name");
  expect(Object.keys(graph.nodes)).toHaveLength(0);
  expect(graph.userdata).toStrictEqual({});
});

test("dump d2 and graphviz", () => {
  const graph = new arguebuf.Graph({
    nodes: [
      new arguebuf.AtomNode({ id: "a", text: `${"x".repeat(33)} "y"` }),
      new arguebuf.AtomNode({ id: "b", text: 'a\nb back\\slash "q" $x\\' }),
    ],
    majorClaim: "a",
  });

  expect(arguebuf.dump.d2(graph)).toContain('label: "a b back\\\\slash \\"q\\" \\$x\\\\"\n');
  expect(arguebuf.dump.graphviz(graph)).toContain(
    `"a" [label="${"x".repeat(33)}\n\\"y\\"", fontcolor="#ffffff", fillcolor="#0D47A1", color="#0D47A1", root="true"];`,
  );
  expect(arguebuf.dump.graphviz(graph)).toContain('[label="a b back\\\\slash \\"q\\" $x\\\\"');
});

test("dump graphology", () => {
  const atom = new arguebuf.AtomNode({ text: "a" });
  const scheme = new arguebuf.SchemeNode({
    scheme: { case: "support", value: arguebuf.Support.DEFAULT },
  });
  const graph = new arguebuf.Graph({
    nodes: [atom, scheme],
    edges: [new arguebuf.Edge({ source: atom.id, target: scheme.id })],
  });
  const result = dumpGraphology(graph, { schemeAttrs: { kind: (node) => node.label } });

  expect(result.getNodeAttributes(scheme.id)).toStrictEqual({ label: "Support", kind: "Support" });
  expect(result.getNodeAttributes(atom.id)).toStrictEqual({ label: "a" });
  expect(result.size).toBe(1);
});

test("lenient json loaders", () => {
  const aif = {
    nodes: [
      { nodeID: 1, text: "Default Conflict", type: "CA", scheme: null },
      { nodeID: 2, text: "A", type: "I", timestamp: "2019-03-23 15:57:30" },
    ],
    edges: [],
  } satisfies arguebuf.schemas.aif.Graph;

  expect(arguebuf.load.json(aif).nodes["1"].label).toBe("Attack");
  expect(
    arguebuf.load.json({ ...aif, nodes: [{ ...aif.nodes[1], nodeID: 2.0 }] }).nodes,
  ).toHaveProperty("2");
  expect(() => arguebuf.load.json({ ...aif, nodes: [{ ...aif.nodes[1], nodeID: 1.5 }] })).toThrow(
    "neither a string nor a safe integer",
  );

  for (const text of [undefined, null, { txt: null }]) {
    const graph = arguebuf.load.json({
      AIF: { ...aif, schemefulfillments: null },
      text,
    });

    expect(Object.keys(graph.resources)).toHaveLength(0);
  }

  const sadface = arguebuf.load.json({
    metadata: { core: { id: "g", version: "0.5", edited: "2020-01-01T00:00:00" } },
    nodes: [],
    edges: [],
  });

  expect(sadface.metadata.created).toStrictEqual(Temporal.Instant.from("2020-01-01T00:00Z"));
  expect(sadface.metadata.updated).toStrictEqual(sadface.metadata.created);
});

test("protobuf rejects unknown schemes", () => {
  const message = '{"nodes": {"s": {"scheme": {"support": 999}}}}';

  expect(() => arguebuf.load.json(JSON.parse(message))).toThrow("unknown support scheme");
});

test("html spans", () => {
  const [text, spans] = parseHtml(
    '<span title="x id=n1" id="n2" id="n3">a</span>' +
      "<span id='n4' title=\"a>b\">c &amp; <b>d</b></span><br/><!-- <span id=n5> -->" +
      '<span id="n6">e<span id="n7">f</span><span id="n6">g</span></span>',
  );

  expect(text).toBe("ac & d\nefg");
  expect([...spans]).toStrictEqual([
    ["n2", { text: "a", offset: 0 }],
    ["n4", { text: "c & d", offset: 1 }],
    ["n6", { text: "efg", offset: 7 }],
    ["n7", { text: "f", offset: 8 }],
  ]);
});

test("html with many spans", () => {
  const count = 32000;
  const [text, spans] = parseHtml(
    Array.from({ length: count }, (_, i) => `<span id="n${i}">t${i}</span>`).join(" "),
  );

  expect(spans.size).toBe(count);
  expect(spans.get(`n${count - 1}`)).toStrictEqual({
    text: `t${count - 1}`,
    offset: text.length - `t${count - 1}`.length,
  });
});

test("references keep the offset unless the resource is unknown", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const resources = { r: new arguebuf.Resource({ id: "r", text: "Text" }) };
  const reference = (resource?: string) => newReference("T", resource, 1, resources, "x");

  expect(reference("r")).toStrictEqual(
    new arguebuf.Reference({ text: "T", resource: "r", offset: 1 }),
  );
  expect(reference("")).toStrictEqual(new arguebuf.Reference({ text: "T", offset: 1 }));
  expect(reference()).toStrictEqual(new arguebuf.Reference({ text: "T", offset: 1 }));
  expect(reference("missing")).toStrictEqual(new arguebuf.Reference({ text: "T" }));
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});
