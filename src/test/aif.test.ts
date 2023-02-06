import { assertType, expect, test } from "vitest";
import * as arguebuf from "../index.js";

const aifGraph: arguebuf.schemas.aif.Graph = {
  nodes: [
    {
      nodeID: "119927",
      text: "Yes, it's annoying and cumbersome to separate your rubbish properly all the time.",
      type: "I",
      timestamp: "2015-12-14 12:09:13",
    },
    {
      nodeID: "119928",
      text: "Three different bin bags stink away in the kitchen and have to be sorted into different wheelie bins.",
      type: "I",
      timestamp: "2015-12-14 12:09:14",
    },
    {
      nodeID: "119929",
      text: "But still Germany produces way too much rubbish",
      type: "I",
      timestamp: "2015-12-14 12:09:14",
    },
    {
      nodeID: "119930",
      text: "and too many resources are lost when what actually should be separated and recycled is burnt.",
      type: "I",
      timestamp: "2015-12-14 12:09:14",
    },
    {
      nodeID: "119931",
      text: "We Berliners should take the chance and become pioneers in waste separation!",
      type: "I",
      timestamp: "2015-12-14 12:09:14",
    },
    {
      nodeID: "119932",
      text: "Default Conflict",
      type: "CA",
      timestamp: "2015-12-14 12:09:14",
    },
    {
      nodeID: "119933",
      text: "Default Inference",
      type: "RA",
      timestamp: "2015-12-14 12:09:14",
    },
    {
      nodeID: "119934",
      text: "Default Conflict",
      type: "CA",
      timestamp: "2015-12-14 12:09:14",
    },
  ],
  edges: [
    { edgeID: "160906", fromID: "119927", toID: "119932", formEdgeID: null },
    { edgeID: "160907", fromID: "119932", toID: "119931", formEdgeID: null },
    { edgeID: "160908", fromID: "119928", toID: "119933", formEdgeID: null },
    { edgeID: "160909", fromID: "119933", toID: "119927", formEdgeID: null },
    { edgeID: "160910", fromID: "119929", toID: "119934", formEdgeID: null },
    { edgeID: "160911", fromID: "119934", toID: "119932", formEdgeID: null },
    { edgeID: "160912", fromID: "119930", toID: "119934", formEdgeID: null },
  ],
  locutions: [],
};

test("graph: aif2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.aif(aifGraph);

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
