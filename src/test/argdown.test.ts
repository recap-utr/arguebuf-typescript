import { test } from "vitest";
import graph from "../../data/arguebase-public/argdown-examples/format=argdown,lang=en/argdown-primer.argdown?raw";
import * as arguebuf from "../index.js";

test("graph: aif2arguebuf", () => {
  const g = arguebuf.load.argdown(graph);
  console.log(g);
});
