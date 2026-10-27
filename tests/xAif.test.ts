import { assertType, expect, test } from "vitest";
import xaifGraph from "#data/xaif.json" with { type: "json" };
import * as arguebuf from "#/index.js";

test("graph: xaif2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.xaif(
    xaifGraph as arguebuf.schemas.xaif.Graph,
  );

  // Test some graph properties
  assertType<arguebuf.Graph>(arguebufGraph);
  expect(Object.keys(arguebufGraph.resources).length).toStrictEqual(1);
  expect(Object.keys(arguebufGraph.analysts)).toStrictEqual([]);
  expect(arguebufGraph.metadata).not.toStrictEqual({});

  // Test a specific node in the graph
  const n1: arguebuf.Node = arguebufGraph.nodes["2_164926129380455983"];
  expect(n1).toMatchObject({
    type: "atom",
    text: "A",
  });

  // Edges of dialog nodes are skipped, locutions become participants and references
  const e1: arguebuf.Edge = arguebufGraph.edges["11"];
  expect(e1.source).toStrictEqual("15_164926162804546033");
  expect(e1.target).toStrictEqual("21_164926162804546033");
  expect(Object.keys(arguebufGraph.edges)).toStrictEqual(["11", "12"]);
  expect(n1).toMatchObject({ participant: "1", reference: { text: "Participant Rachel: A" } });
  expect(Object.values(arguebufGraph.resources)[0].text).toStrictEqual("A because B\n");
});
