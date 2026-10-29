import type * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";
import type { D2Options } from "#/dump/d2.js";

/** Graphviz `splines`: bezier curves, straight lines, or orthogonal steps. */
export type EdgeStyle = "curved" | "line" | "ortho";
export type Attributes = Readonly<Record<string, string>>;

export interface GraphvizOptions<S extends UserdataSchema = {}> extends D2Options<S> {
  nodesep?: number;
  ranksep?: number;
  wrapCol?: number;
  margin?: readonly [number, number];
  fontName?: string;
  fontSize?: number;
  graphAttr?: Attributes;
  nodeAttr?: Attributes;
  edgeAttr?: Attributes;
  edgeStyle?: EdgeStyle;
}

// backslashes are escapes in DOT labels, e.g. `\N` is the node id
const quote = (value: string) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

const attributes = (attrs: Attributes) =>
  `[${Object.entries(attrs)
    .map(([key, value]) => `${key}=${quote(value)}`)
    .join(", ")}]`;

// characters of Python's `str.isspace`
const SPACE = String.raw`\t-\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000`;
const BLANK = new RegExp(`^[${SPACE}]*$`);
const STRIP = new RegExp(`^[${SPACE}]+|[${SPACE}]+$`, "g");

function expandTabs(text: string, size = 8): string {
  let column = 0;
  let result = "";

  for (const char of text) {
    if (char === "\t") {
      result += " ".repeat(size - (column % size));
      column += size - (column % size);
    } else {
      result += char;
      column = char === "\n" || char === "\r" ? 0 : column + 1;
    }
  }

  return result;
}

/**
 * Wrap text into lines of at most `width` characters,
 * like Python's `textwrap.fill(text, width, break_on_hyphens=False)`.
 */
function wrap(text: string, width: number): string {
  if (width < 1) {
    throw new RangeError(`The wrap width ${width} must be positive.`);
  }

  // chunks are runs of spaces or words, as arrays of code points
  const chunks = expandTabs(text)
    .replaceAll(/[\t\n\v\f\r]/g, " ")
    .split(/( +)/)
    .filter(Boolean)
    .map((chunk) => Array.from(chunk))
    .reverse();
  const isBlank = (chunk: readonly string[] | undefined) =>
    chunk !== undefined && BLANK.test(chunk.join(""));
  const lines: string[] = [];

  while (chunks.length > 0) {
    const line: string[][] = [];
    let length = 0;

    if (lines.length > 0 && isBlank(chunks.at(-1))) {
      chunks.pop();
    }

    for (let chunk = chunks.at(-1); chunk !== undefined; chunk = chunks.at(-1)) {
      if (length + chunk.length > width) {
        // words longer than a line are broken
        if (chunk.length > width && length < width) {
          line.push(chunk.slice(0, width - length));
          chunks[chunks.length - 1] = chunk.slice(width - length);
        }

        break;
      }

      line.push(chunk);
      length += chunk.length;
      chunks.pop();
    }

    if (isBlank(line.at(-1))) {
      line.pop();
    }

    if (line.length > 0) {
      lines.push(line.flat().join(""));
    }
  }

  return lines.join("\n");
}

/**
 * Export a graph to the DOT language of Graphviz, undefined if it has more than `maxNodes` nodes.
 * Atom labels are wrapped after `wrapCol` characters.
 */
export function graphviz<S extends UserdataSchema>(
  graph: model.Graph<S>,
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

  const graphAttr = {
    rankdir: "BT",
    margin: "0",
    nodesep: String(nodesep),
    ranksep: String(ranksep),
    overlap: "false",
    splines: edgeStyle,
    ...options.graphAttr,
  };
  const nodeAttr = {
    fontname: fontName,
    fontsize: String(fontSize),
    margin: `${marginX},${marginY}`,
    style: "rounded,filled",
    shape: "box",
    width: "0",
    height: "0",
    ...options.nodeAttr,
  };
  const edgeAttr = { color: monochrome ? "#000000" : "#9E9E9E", ...options.edgeAttr };

  const nodeAttrs = (color: model.Color) => ({
    fontcolor: color.fg,
    fillcolor: color.bg,
    color: color.border,
  });
  const atoms = nodes
    .filter((node) => node.type === "atom")
    .map((node) => {
      const majorClaim = graph.majorClaim === node.id;
      const label = wrap(atomLabel?.(node) ?? node.label, wrapCol).replaceAll(STRIP, "");
      const attrs = {
        label,
        ...nodeAttrs(node.color(majorClaim, monochrome)),
        root: String(majorClaim),
      };

      return `${quote(node.id)} ${attributes(attrs)};`;
    });
  const schemes = (schemeNodes ? nodes : [])
    .filter((node) => node.type === "scheme")
    .map((node) => {
      const label = schemeLabel?.(node) ?? node.label;

      return `${quote(node.id)} ${attributes({ label, ...nodeAttrs(node.color(false, monochrome)) })};`;
    });
  // strict graphs merge parallel edges
  const edges = new Set(
    schemeNodes
      ? Object.values(graph.edges).map((edge) => `${quote(edge.source)} -> ${quote(edge.target)};`)
      : graph
          .atomRelations()
          .map(
            ({ source, target, scheme }) =>
              `${quote(source.id)} -> ${quote(target.id)} ${attributes({ color: scheme.color(false, monochrome).bg })};`,
          ),
  );
  const name = graph.name === undefined ? "" : `${quote(graph.name)} `;

  return [
    `strict digraph ${name}{`,
    `graph ${attributes(graphAttr)};`,
    `node ${attributes(nodeAttr)};`,
    `edge ${attributes(edgeAttr)};`,
    ...atoms,
    ...schemes,
    ...edges,
    "}\n",
  ].join("\n");
}
