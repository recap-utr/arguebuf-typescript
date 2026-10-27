import { expect, test } from "vitest";
import { loadArgdown } from "#/argdown.js";
import * as arguebuf from "#/index.js";

type Export = arguebuf.schemas.argdown.Graph;

const samples = "/data/arguebase/argdown-examples";
const sampleTexts = import.meta.glob<string>(
  "/data/arguebase/argdown-examples/format=argdown,lang=en/*.argdown",
  { query: "?raw", import: "default", eager: true },
);
const sampleExports = import.meta.glob<Export>(
  "/data/arguebase/argdown-examples/format=argdown-json,lang=en/*.json",
  { import: "default", eager: true },
);

// Graph structure without generated ids and timestamps
function canonical(graph: arguebuf.Graph) {
  const ids = Object.keys(graph.nodes);

  return {
    userdata: graph.userdata,
    nodes: Object.values(graph.nodes).map((node) => [
      node.type === "atom" ? node.text : (node.scheme.case ?? ""),
      node.userdata,
    ]),
    edges: Object.values(graph.edges).map((edge) => [
      ids.indexOf(edge.source),
      ids.indexOf(edge.target),
    ]),
  };
}

test.each(Object.keys(sampleTexts))("argdown: sample %s", (path) => {
  const name = path.split("/").at(-1)!.replace(".argdown", "");
  const fromText = loadArgdown(sampleTexts[path]!);
  const fromExport = arguebuf.load.argdown(
    sampleExports[`${samples}/format=argdown-json,lang=en/${name}.json`]!,
  );

  expect(Object.keys(fromExport.nodes).length).toBeGreaterThan(0);
  // The upstream export lacks the front matter
  expect(canonical(fromText)).toStrictEqual({
    ...canonical(fromExport),
    userdata: fromText.userdata,
  });
});

test("argdown: invalid input", () => {
  expect(() => loadArgdown("(1) Premise.\n(2) Missing inference.")).toThrow(
    /^Invalid Argdown input:\n\d+:\d+ /,
  );
});
