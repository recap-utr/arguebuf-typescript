import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import { expect, expectTypeOf, test } from "vitest";
import * as z from "zod";
import * as arguebuf from "#/index.js";
import { addEdge, loadOptions } from "#/load/helpers.js";

interface AtomData {
  label: string;
  embedding?: Float32Array;
}

// validates on decode, the embedding is only kept in memory
const atom: arguebuf.Codec<AtomData> = {
  decode(data) {
    if (typeof data.label !== "string") {
      throw new TypeError("The label must be a string.");
    }

    return { label: data.label };
  },
  encode: ({ label }) => ({ label }),
};

const codecs = { atom };

function sample(label: arguebuf.JsonValue): GraphJson {
  return {
    nodes: { a: { atom: { text: "A" }, userdata: { label } }, s: { scheme: {} } },
    edges: { e: { source: "a", target: "s", userdata: { weight: 1 } } },
  };
}

test("codecs decode and encode userdata", () => {
  const graph = arguebuf.load.json(sample("x"), { codecs });
  graph.atomNodes.a.userdata.embedding = new Float32Array([1, 2]);
  const dumped = arguebuf.dump.json(graph, { codecs });
  const loaded = arguebuf.load.json(dumped, { codecs });

  expect(dumped.nodes?.a.userdata).toStrictEqual({ label: "x" });
  expect(loaded.atomNodes.a.userdata).toStrictEqual({ label: "x" });
  expect(loaded.edges.e.userdata).toStrictEqual({ weight: 1 });
  expect(() => arguebuf.load.json(sample(1), { codecs })).toThrow(TypeError);
});

test("graphs without codecs keep their JSON userdata", () => {
  const graph = arguebuf.load.json(sample("x"));

  expect(arguebuf.dump.json(graph).nodes?.a.userdata).toStrictEqual({ label: "x" });
});

test.each([null, undefined])("constructors and codecs preserve %s userdata", (userdata) => {
  type Nullable = { [K in arguebuf.UserdataKind]: null | undefined };
  const codec: arguebuf.Codec<null | undefined> = { decode: () => userdata, encode: () => ({}) };
  const codecs = {
    graph: codec,
    atom: codec,
    scheme: codec,
    edge: codec,
    resource: codec,
    participant: codec,
    analyst: codec,
  };
  const graph = new arguebuf.Graph<Nullable>({
    userdata,
    resources: [new arguebuf.Resource<null | undefined>({ text: "", userdata })],
    participants: [new arguebuf.Participant<null | undefined>({ userdata })],
    analysts: [new arguebuf.Analyst<null | undefined>({ userdata })],
    nodes: [
      new arguebuf.AtomNode<null | undefined>({ id: "a", text: "", userdata }),
      new arguebuf.SchemeNode<null | undefined>({ id: "s", userdata }),
    ],
    edges: [new arguebuf.Edge<null | undefined>({ source: "a", target: "s", userdata })],
  });
  const loaded = arguebuf.load.json(arguebuf.dump.json(graph, { codecs }), { codecs });

  for (const value of [graph, loaded]) {
    expect(
      [
        value,
        ...Object.values(value.nodes),
        ...Object.values(value.edges),
        ...Object.values(value.resources),
        ...Object.values(value.participants),
        ...Object.values(value.analysts),
      ].map((entity) => entity.userdata),
    ).toStrictEqual(Array(7).fill(userdata));
  }
});

test("deep copy clones in-memory userdata", () => {
  const graph = arguebuf.load.json(sample("x"), { codecs });
  graph.atomNodes.a.userdata.embedding = new Float32Array([1, 2]);
  const copy = arguebuf.deepCopy(graph);
  const embedding = copy.atomNodes.a.userdata.embedding;

  expect(copy).toStrictEqual(graph);
  expect(embedding).not.toBe(graph.atomNodes.a.userdata.embedding);
});

test("userdata types", () => {
  const graph = arguebuf.load.json(sample("x"), { codecs });

  expectTypeOf(graph).toEqualTypeOf<arguebuf.Graph<{ atom: AtomData }>>();
  expectTypeOf(graph.atomNodes.a.userdata).toEqualTypeOf<AtomData>();
  expectTypeOf(graph.schemeNodes.s.userdata).toEqualTypeOf<arguebuf.JsonObject>();

  // elements are interchangeable across schemas that do not customize their kind
  const custom = new arguebuf.Graph<{ atom: AtomData }>();
  custom.addAnalyst(new arguebuf.Analyst());
  // @ts-expect-error customized kinds stay type safe
  custom.addNode(new arguebuf.AtomNode({ text: "" }));

  // @ts-expect-error the atom codec is required
  arguebuf.dump.protobuf(graph);
  // @ts-expect-error the atom codec is required
  arguebuf.dump.json(graph, {});
  expect(() =>
    // @ts-expect-error the edge userdata cannot be created
    new arguebuf.Graph<{ edge: AtomData }>().connect([], "s", "a"),
  ).toThrow(arguebuf.GraphError);
  arguebuf.load.argdown(
    { statements: {}, arguments: {}, relations: [] },
    // @ts-expect-error only the AIF, xAIF, and JSON loaders reconstruct dialogs
    { reconstructDialog: true },
  );

  type Plain = arguebuf.Graph;
  expectTypeOf(new arguebuf.Graph()).toEqualTypeOf<arguebuf.Graph<{}>>();
  expectTypeOf<Plain["userdata"]>().toEqualTypeOf<arguebuf.JsonObject>();
  expectTypeOf<Plain["nodes"][string]["userdata"]>().toEqualTypeOf<arguebuf.JsonObject>();
  expectTypeOf<Plain["edges"][string]["userdata"]>().toEqualTypeOf<arguebuf.JsonObject>();
  expectTypeOf<Plain["resources"][string]["userdata"]>().toEqualTypeOf<arguebuf.JsonObject>();
  expectTypeOf<Plain["participants"][string]["userdata"]>().toEqualTypeOf<arguebuf.JsonObject>();
  expectTypeOf<Plain["analysts"][string]["userdata"]>().toEqualTypeOf<arguebuf.JsonObject>();
  expectTypeOf(arguebuf.load.json(sample("x"))).toEqualTypeOf<arguebuf.Graph>();
});

test("zod codecs and schemas can be passed directly", () => {
  const zodAtom = z.codec(
    z.object({ label: z.string() }),
    z.object({ label: z.string(), embedding: z.instanceof(Float32Array).optional() }),
    { decode: (json) => json, encode: ({ label }) => ({ label }) },
  );
  const graph = arguebuf.load.json(sample("x"), {
    codecs: { atom: zodAtom, edge: z.object({ weight: z.number() }) },
  });
  const userdata = graph.atomNodes.a.userdata;

  expectTypeOf(userdata).toEqualTypeOf<z.output<typeof zodAtom>>();
  expectTypeOf(graph.edges.e.userdata).toEqualTypeOf<{ weight: number }>();
  userdata.embedding = new Float32Array([1]);

  const dumped = arguebuf.dump.json(graph, {
    codecs: { atom: zodAtom, edge: z.object({ weight: z.number() }) },
  });

  expect(dumped.nodes?.a?.userdata).toEqual({ label: "x" });
  expect(() => arguebuf.load.json(sample(1), { codecs: { atom: zodAtom } })).toThrow(z.ZodError);
});

test("repairing atom edges preserves required userdata and metadata", () => {
  const graph = new arguebuf.Graph<{ edge: AtomData }>({
    nodes: [
      new arguebuf.AtomNode({ id: "a", text: "A" }),
      new arguebuf.AtomNode({ id: "b", text: "B" }),
    ],
  });
  const metadata = new arguebuf.Metadata({
    created: arguebuf.Temporal.Instant.from("2000-01-01T00:00Z"),
  });
  const issues: arguebuf.Issue[] = [];
  const context = loadOptions<{ edge: AtomData }>({
    codecs: { edge: atom },
    onIssue: (issue) => issues.push(issue),
  });
  addEdge(graph, context, {
    id: "e",
    source: "a",
    target: "b",
    metadata,
    userdata: { label: "required" },
  });

  expect(issues.map(({ code }) => code)).toEqual(["atom-edge"]);
  expect(Object.values(graph.edges)).toHaveLength(2);
  expect(graph.edges.e.source).toBe("a");

  for (const edge of Object.values(graph.edges)) {
    expect(edge.userdata).toEqual({ label: "required" });
    expect(edge.metadata).toBe(metadata);
  }
});
