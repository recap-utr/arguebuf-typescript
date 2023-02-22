import { assertType, expect, test } from "vitest";
import * as arguebuf from "../index.js";
import * as model from "../model/index.js";
import { readFileSync } from "fs";

test("graph: kialo2arguebuf", () => {
  const kialoFile: string = readFileSync("src/test/kialoTestFile.txt", "utf-8");
  const g: model.Graph = arguebuf.load.kialo(kialoFile);

  // Test some graph properties
  assertType<arguebuf.Graph>(g);
  expect(g.resources).toStrictEqual({});
  expect(g.analysts).toStrictEqual({});
  expect(g.metadata).not.toStrictEqual({});

  // Test a specific atom node in the graph
  const n1: arguebuf.Node = g.nodes["1.6.5."];
  expect(n1.type).toStrictEqual("atom");
  if (n1.type === "atom") {
    expect(n1.text).toStrictEqual(
      "Understanding life is not the only purpose of faith, so even if it is not needed for that there is still a place for it."
    );
  }

  // Test a specific scheme node in the graph
  const n2: arguebuf.Node = g.nodes["1.6.5.scheme"];
  expect(n2.type).toStrictEqual("scheme");
  if (n2.type === "scheme") {
    expect(n2.scheme.case).toStrictEqual("attack");
  }

  // Test a specific edge in the graph
  const e1: arguebuf.Edge = g.edges["1.6.5.->1.6.5.scheme"];
  assertType<arguebuf.Edge>(e1);
  expect(e1.source.id).toStrictEqual("1.6.5.");
  expect(e1.target.id).toStrictEqual("1.6.5.scheme");
  expect(e1.metadata).not.toStrictEqual({});
});
