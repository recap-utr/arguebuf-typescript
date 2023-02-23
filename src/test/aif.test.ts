import { assertType, expect, test } from "vitest";
import aifGraph from "../../data/arguebase-public/microtexts/format=aif,lang=en/nodeset6361.json";
import * as arguebuf from "../index.js";

test("graph: aif2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.aif(
    aifGraph as arguebuf.schemas.aif.Graph
  );

  // Test some graph properties
  assertType<arguebuf.Graph>(arguebufGraph);
  expect(arguebufGraph.resources).toStrictEqual({});
  expect(arguebufGraph.analysts).toStrictEqual({});
  expect(arguebufGraph.metadata).not.toStrictEqual({});

  // Test a specific node in the graph
  const n1: arguebuf.Node = arguebufGraph.nodes["119928"];
  expect(n1.type).toStrictEqual("atom");
  if (n1.type === "atom") {
    expect(n1.text).toStrictEqual(
      "Three different bin bags stink away in the kitchen and have to be sorted into different wheelie bins."
    );
  }
  const comparisonDate = new Date(2015, 11, 14, 12, 9, 14);
  expect(n1.metadata.created).toStrictEqual(comparisonDate);
  expect(n1.metadata.updated).toStrictEqual(comparisonDate);

  // Test a specific Edge in the graph
  const e1: arguebuf.Edge = arguebufGraph.edges["160911"];
  expect(e1.source.id).toStrictEqual("119934");
  expect(e1.target.id).toStrictEqual("119932");
  expect(e1.metadata).not.toStrictEqual({});
});
