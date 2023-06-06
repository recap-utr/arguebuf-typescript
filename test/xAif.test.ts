import { assertType, expect, test } from "vitest";
import xaifgraph from "../data/xaif.json";
import * as arguebuf from "../src/index.js";

test("graph: xaif2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.xAif(
    xaifgraph as arguebuf.schemas.xAif.Graph
  );

  // Test some graph properties
  assertType<arguebuf.Graph>(arguebufGraph);
  expect(arguebufGraph.resources).toStrictEqual({});
  expect(arguebufGraph.analysts).toStrictEqual({});
  expect(arguebufGraph.metadata).not.toStrictEqual({});

  // Test a specific node in the graph
  const n1: arguebuf.Node = arguebufGraph.nodes["599143_164813044708340528"];
  expect(n1.type).toStrictEqual("atom");
  if (n1.type === "atom") {
    expect(n1.text).toStrictEqual("section 172 of the Crimes Act 1900");
  }

  // Test a specific Edge in the graph
  const e1: arguebuf.Edge = arguebufGraph.edges["639"];
  expect(e1.source).toStrictEqual("1042_164813044708340528");
  expect(e1.target).toStrictEqual("1014_164813044708340528");
  expect(e1.metadata).not.toStrictEqual({});
});
