import { assertType, expect, test } from "vitest";
import xaifGraph from "../data/xaif.json" with { type: "json" };
import * as arguebuf from "../src/index.js";

test("graph: xaif2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.xaif(
    xaifGraph as arguebuf.schemas.xaif.Graph,
  );

  // Test some graph properties
  assertType<arguebuf.Graph>(arguebufGraph);
  expect(Object.keys(arguebufGraph.resources).length).toStrictEqual(1);
  expect(arguebufGraph.analysts).toStrictEqual({});
  expect(arguebufGraph.metadata).not.toStrictEqual({});

  // Test a specific node in the graph
  const n1: arguebuf.Node = arguebufGraph.nodes["2_164926129380455983"];
  expect(n1).toMatchObject({
    type: "atom",
    text: "A",
  });

  // Test a specific Edge in the graph
  const e1: arguebuf.Edge = arguebufGraph.edges["1"];
  expect(e1.source).toStrictEqual("4_164926129380455983");
  expect(e1.target).toStrictEqual("3_164926129380455983");
  expect(e1.metadata).not.toStrictEqual({});
});
