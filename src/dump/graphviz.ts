import {
  type EdgeAttributesObject,
  type GraphAttributesObject,
  type NodeAttributesObject,
  strict,
  toDot,
} from "ts-graphviz";
import wrap from "word-wrap";
import type * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";
import type { D2Options } from "#/dump/d2.js";

/** Graphviz `splines`: bezier curves, straight lines, or orthogonal steps. */
export type EdgeStyle = "curved" | "line" | "ortho";

export interface GraphvizOptions<S extends UserdataSchema = {}> extends D2Options<S> {
  nodesep?: number;
  ranksep?: number;
  wrapCol?: number;
  margin?: readonly [number, number];
  fontName?: string;
  fontSize?: number;
  graphAttr?: GraphAttributesObject;
  nodeAttr?: NodeAttributesObject;
  edgeAttr?: EdgeAttributesObject;
  edgeStyle?: EdgeStyle;
}

// ts-graphviz keeps backslashes for escapes like `\l`, so literal ones are doubled
const literal = (text: string) => text.replaceAll("\\", "\\\\");

const nodeColors = (color: model.Color): NodeAttributesObject => ({
  fontcolor: color.fg,
  fillcolor: color.bg,
  color: color.border,
});

/**
 * Export a graph to the DOT language of Graphviz, undefined if it has more than `maxNodes` nodes.
 * Atom labels are wrapped after `wrapCol` characters.
 */
export function graphviz<S extends UserdataSchema>(
  graph: model.GraphView<S>,
  options: GraphvizOptions<S> = {},
): string | undefined {
  const {
    nodesep = 0.25,
    ranksep = 0.5,
    wrapCol = 36,
    margin: [marginX, marginY] = [0.15, 0.1],
    fontName = "Arial",
    fontSize = 11,
    atomLabel,
    schemeLabel,
    edgeStyle = "ortho",
    maxNodes = 1000,
    monochrome = false,
    schemeNodes = true,
  } = options;

  const nodes = Object.values(graph.nodes);

  if (nodes.length > maxNodes) {
    return undefined;
  }

  // strict graphs merge parallel edges
  const dot = strict.digraph(graph.name ?? "", (g) => {
    g.attributes.graph.apply({
      rankdir: "BT",
      margin: 0,
      nodesep,
      ranksep,
      overlap: false,
      splines: edgeStyle,
      ...options.graphAttr,
    });
    g.attributes.node.apply({
      fontname: fontName,
      fontsize: fontSize,
      margin: `${marginX},${marginY}`,
      style: "rounded,filled",
      shape: "box",
      width: 0,
      height: 0,
      ...options.nodeAttr,
    });
    g.attributes.edge.apply({ color: monochrome ? "#000000" : "#9E9E9E", ...options.edgeAttr });

    for (const node of nodes) {
      if (node.type === "atom") {
        const majorClaim = graph.majorClaim === node.id;
        const text = (atomLabel?.(node) ?? node.label).replaceAll(/\s+/g, " ").trim();
        g.node(node.id, {
          label: literal(wrap(text, { width: wrapCol, indent: "", trim: true })),
          ...nodeColors(node.color({ majorClaim, monochrome })),
          root: majorClaim,
        });
      } else if (schemeNodes) {
        const label = literal(schemeLabel?.(node) ?? node.label);
        g.node(node.id, { label, ...nodeColors(node.color({ monochrome })) });
      }
    }

    if (schemeNodes) {
      for (const edge of Object.values(graph.edges)) {
        g.edge([edge.source, edge.target]);
      }
    } else {
      for (const { source, target, scheme } of graph.atomRelations()) {
        g.edge([source.id, target.id], { color: scheme.color({ monochrome }).bg });
      }
    }
  });

  return toDot(dot);
}
