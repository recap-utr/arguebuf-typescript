import type * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Options of the D2 export, shared with the Graphviz export. */
export interface D2Options<S extends UserdataSchema = {}> {
  atomLabel?: (node: model.AtomNodeOf<S>) => string;
  schemeLabel?: (node: model.SchemeNodeOf<S>) => string;
  maxNodes?: number;
  monochrome?: boolean;
  /** If false, scheme nodes are collapsed into edges between atoms colored by their scheme. */
  schemeNodes?: boolean;
}

// d2 double-quoted strings use the same escapes as JSON, `$` starts a substitution
const quote = (value: string) => JSON.stringify(value).replaceAll("$", "\\$");

function nodeToD2(node: { readonly id: string }, label: string, color: model.Color): string {
  return [
    `${quote(node.id)}: {`,
    `label: ${quote(label.replaceAll("\n", " "))}`,
    "shape: rectangle",
    "style: {",
    `font-color: ${quote(color.fg)}`,
    "bold: false",
    `stroke: ${quote(color.border)}`,
    "stroke-width: 2",
    `fill: ${quote(color.bg)}`,
    "}",
    "}\n",
  ].join("\n");
}

/** Export a graph to the D2 diagram language, undefined if it has more than `maxNodes` nodes. */
export function d2<S extends UserdataSchema>(
  graph: model.GraphView<S>,
  options: D2Options<S> = {},
): string | undefined {
  const { atomLabel, schemeLabel, maxNodes = 1000, monochrome = false, schemeNodes = true } = options;

  const nodes = Object.values(graph.nodes);

  if (nodes.length > maxNodes) {
    return undefined;
  }

  const atoms = nodes
    .filter((node) => node.type === "atom")
    .map((node) =>
      nodeToD2(
        node,
        atomLabel?.(node) ?? node.label,
        node.color(graph.majorClaim === node.id, monochrome),
      ),
    );
  const schemes = (schemeNodes ? nodes : [])
    .filter((node) => node.type === "scheme")
    .map((node) =>
      nodeToD2(node, schemeLabel?.(node) ?? node.label, node.color(false, monochrome)),
    );
  const edges = schemeNodes
    ? Object.values(graph.edges).map((edge) => `${quote(edge.source)} -> ${quote(edge.target)}\n`)
    : graph
        .atomRelations()
        .map(
          ({ source, target, scheme }) =>
            `${quote(source.id)} -> ${quote(target.id)}: {style.stroke: ${quote(scheme.color(false, monochrome).bg)}}\n`,
        );

  return [...atoms, ...schemes, ...edges].join("");
}
