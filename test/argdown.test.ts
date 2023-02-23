import { expect, test } from "vitest";
import graph from "../data/arguebase-public/argdown-examples/format=argdown,lang=en/argdown-primer.argdown?raw";
import * as arguebuf from "../src/index.js";

test("graph: aif2arguebuf", () => {
  const g = arguebuf.load.argdown(graph);
  expect(g.nodes).not.toStrictEqual({});
});
