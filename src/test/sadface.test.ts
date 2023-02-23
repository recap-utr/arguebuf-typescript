import { assertType, expect, test } from "vitest";
import sadfaceGraph from "../../data/sadface.json";
import * as arguebuf from "../index.js";

test("graph: sadface2arguebuf", () => {
  const arguebufGraph: arguebuf.Graph = arguebuf.load.sadface(
    sadfaceGraph as arguebuf.schemas.sadface.Graph
  );

  // Test some graph properties
  assertType<arguebuf.Graph>(arguebufGraph);
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
  let n1: arguebuf.Node =
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
  let n2: arguebuf.Node =
    arguebufGraph.nodes["45199aa0-1556-4b94-8940-3ba30aa08e38"];
  expect(n2.type).toStrictEqual("scheme");
  if (n2.type === "scheme") {
    expect(n2.scheme.case).toStrictEqual("attack");
  }
  expect(n2.metadata.created).not.toStrictEqual(undefined);
  expect(n2.metadata.updated).not.toStrictEqual(undefined);

  // Test a specific Edge in the graph
  let e1: arguebuf.Edge =
    arguebufGraph.edges["bfe3db02-f93f-4d91-bd78-beccee980175"];
  expect(e1.source.id).toStrictEqual("45199aa0-1556-4b94-8940-3ba30aa08e38");
  expect(e1.target.id).toStrictEqual("f129934f-53d2-49f6-8feb-9afaff9aabcf");
  expect(e1.metadata).not.toStrictEqual({});
});
