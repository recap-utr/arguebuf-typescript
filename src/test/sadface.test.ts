import { assertType, expect, test } from "vitest";
import { fromSadface, nodeFromSadface } from "../converter/sadface.js";
import * as model from "../model/index.js";
import * as sadface from "../schema/sadface.js";

// Currently not working because edgeFromSadface needs the node object
// // Test edge
// const sadfaceEdge: sadface.Edge = {
//   id: "3df54ae1-fa41-4ac7-85d5-4badee39215b",
//   source_id: "70447169-9264-41dc-b8e9-50523f8368c1",
//   target_id: "ae3f0c7f-9f69-4cab-9db3-3b9c46f56e09",
// };

// test("edge: sadface2arguebuf", () => {
//   let arguebufEdge = edgeFromSadface(sadfaceEdge);

//   assertType<model.Edge>(arguebufEdge);
//   expect(arguebufEdge.source).toStrictEqual("70447169-9264-41dc-b8e9-50523f8368c1");
//   expect(arguebufEdge.target).toStrictEqual("ae3f0c7f-9f69-4cab-9db3-3b9c46f56e09");
// });

// Test atom node
const sadfaceAtomNode: sadface.AtomNode = {
  id: "6cd219cc-3203-4602-88bd-d3639f86fb37",
  metadata: {},
  sources: [],
  text: "The 'Hang Back' advert does not clearly express the intended message",
  type: "atom",
};

test("atom node: sadface2arguebuf", () => {
  const arguebufNode = nodeFromSadface(sadfaceAtomNode);

  if (arguebufNode.type === "atom") {
    assertType<model.Node>(arguebufNode);
    expect(arguebufNode.type).toStrictEqual("atom");
    expect(arguebufNode.text).toStrictEqual(
      "The 'Hang Back' advert does not clearly express the intended message"
    );
    expect(arguebufNode.metadata.created).not.toStrictEqual(undefined);
    expect(arguebufNode.metadata.updated).not.toStrictEqual(undefined);
  }
});

// Test scheme node
const sadfaceSchemeNode: sadface.SchemeNode = {
  id: "45199aa0-1556-4b94-8940-3ba30aa08e38",
  metadata: {},
  name: "conflict",
  type: "scheme",
};

test("scheme node: sadface2arguebuf", () => {
  let arguebufNode: model.Node = nodeFromSadface(sadfaceSchemeNode);

  if (arguebufNode.type === "scheme") {
    assertType<model.Node>(arguebufNode);
    expect(arguebufNode.type).toStrictEqual("scheme");
    expect(arguebufNode.scheme.value).toStrictEqual(model.Attack.DEFAULT);
    expect(arguebufNode.scheme.case).toStrictEqual("attack");
    expect(arguebufNode.metadata.created).not.toStrictEqual(undefined);
    expect(arguebufNode.metadata.updated).not.toStrictEqual(undefined);
  }
});

// test graph
const sadfaceGraph: sadface.Graph = {
  edges: [
    {
      id: "3df54ae1-fa41-4ac7-85d5-4badee39215b",
      source_id: "70447169-9264-41dc-b8e9-50523f8368c1",
      target_id: "ae3f0c7f-9f69-4cab-9db3-3b9c46f56e09",
    },
    {
      id: "64430e6e-1300-4623-9b89-3c014587f7ae",
      source_id: "f129934f-53d2-49f6-8feb-9afaff9aabcf",
      target_id: "70447169-9264-41dc-b8e9-50523f8368c1",
    },
    {
      id: "1aae6f5e-f1a7-4873-aa64-a606a0e481cd",
      source_id: "6cd219cc-3203-4602-88bd-d3639f86fb37",
      target_id: "70447169-9264-41dc-b8e9-50523f8368c1",
    },
    {
      id: "bfe3db02-f93f-4d91-bd78-beccee980175",
      source_id: "45199aa0-1556-4b94-8940-3ba30aa08e38",
      target_id: "f129934f-53d2-49f6-8feb-9afaff9aabcf",
    },
    {
      id: "3c2f9db7-3b78-4bc0-b990-3d0eacdca90e",
      source_id: "51775eb3-70c0-4d8e-95a5-b34ffba8a280",
      target_id: "45199aa0-1556-4b94-8940-3ba30aa08e38",
    },
  ],
  metadata: {
    core: {
      analyst_email: "siwells@gmail.com",
      analyst_name: "Simon Wells",
      created: "2019-04-22T23:52:30",
      description:
        "An example SADFace document showing an argument analysis of the Hangback cycle safety campaign from the STCD corpora.",
      edited: "2019-04-22T23:52:30",
      id: "42e56df7-4074-40d8-8ea1-4fca5321dd31",
      notes:
        "This is incomplete because the analysis in Pangbourne & Wells (2018) has much more argumenative content.",
      title: "Hangback Example",
      version: "0.2",
    },
  },
  nodes: [
    {
      id: "ae3f0c7f-9f69-4cab-9db3-3b9c46f56e09",
      metadata: {},
      sources: [],
      text: "The 'Hang Back' campaign video should not have been published, and should be withdrawn.",
      type: "atom",
    },
    {
      id: "70447169-9264-41dc-b8e9-50523f8368c1",
      metadata: {},
      name: "support",
      type: "scheme",
    },
    {
      id: "f129934f-53d2-49f6-8feb-9afaff9aabcf",
      metadata: {},
      sources: [],
      text: "The 'Hang Back' campaign was the wrong campaign to run",
      type: "atom",
    },
    {
      id: "6cd219cc-3203-4602-88bd-d3639f86fb37",
      metadata: {},
      sources: [],
      text: "The 'Hang Back' advert does not clearly express the intended message",
      type: "atom",
    },
    {
      id: "45199aa0-1556-4b94-8940-3ba30aa08e38",
      metadata: {},
      name: "conflict",
      type: "scheme",
    },
    {
      id: "51775eb3-70c0-4d8e-95a5-b34ffba8a280",
      metadata: {},
      sources: [],
      text: "Road users have a responsibility to make our roads safer by being more vigilant.",
      type: "atom",
    },
  ],
  resources: [],
};

test("graph: sadface2arguebuf", () => {
  let arguebufGraph: model.Graph = fromSadface(sadfaceGraph);

  // Test some graph properties
  assertType<model.Graph>(arguebufGraph);
  expect(arguebufGraph.resources).toStrictEqual({});
  expect(Object.values(arguebufGraph.analysts)[0].name).toStrictEqual(
    "Simon Wells"
  );
  expect(Object.values(arguebufGraph.analysts)[0].email).toStrictEqual(
    "siwells@gmail.com"
  );
  const comparisonDate = new Date(2019, 3, 22, 23, 52, 30);
  expect(arguebufGraph.metadata.created).toStrictEqual(comparisonDate);
  expect(arguebufGraph.metadata.updated).toStrictEqual(comparisonDate);
  const userdata = {
    notes:
      "This is incomplete because the analysis in Pangbourne & Wells (2018) has much more argumenative content.",
    description:
      "An example SADFace document showing an argument analysis of the Hangback cycle safety campaign from the STCD corpora.",
    title: "Hangback Example",
    version: "0.2",
  };
  expect(arguebufGraph.userdata).toStrictEqual(userdata);

  // Test a specific atom node in the graph
  let n1: model.Node =
    arguebufGraph.nodes["51775eb3-70c0-4d8e-95a5-b34ffba8a280"];
  expect(n1.type).toStrictEqual("atom");
  if (n1.type === "atom") {
    expect(n1.text).toStrictEqual(
      "Road users have a responsibility to make our roads safer by being more vigilant."
    );
  }
  expect(n1.metadata.created).not.toStrictEqual(undefined);
  expect(n1.metadata.updated).not.toStrictEqual(undefined);

  // Test a specific scheme node in the graph
  let n2: model.Node =
    arguebufGraph.nodes["45199aa0-1556-4b94-8940-3ba30aa08e38"];
  expect(n2.type).toStrictEqual("scheme");
  if (n2.type === "scheme") {
    expect(n2.scheme.case).toStrictEqual("attack");
  }
  expect(n2.metadata.created).not.toStrictEqual(undefined);
  expect(n2.metadata.updated).not.toStrictEqual(undefined);

  // Test a specific Edge in the graph
  let e1: model.Edge =
    arguebufGraph.edges["bfe3db02-f93f-4d91-bd78-beccee980175"];
  expect(e1.source.id).toStrictEqual("45199aa0-1556-4b94-8940-3ba30aa08e38");
  expect(e1.target.id).toStrictEqual("f129934f-53d2-49f6-8feb-9afaff9aabcf");
  expect(e1.metadata).not.toStrictEqual({});
});
