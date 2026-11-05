import type * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";
import { brat } from "#/load/brat.js";
import type * as helpers from "#/load/helpers.js";
import { json, type JsonGraph } from "#/load/json.js";
import { text } from "#/load/text.js";

const fileFormats = ["json", "brat", "text", "argdown"] as const;

/** Formats of files, see `suffixes`. */
export type FileFormat = (typeof fileFormats)[number];

/**
 * Lowercase file suffixes by format.
 * Argdown sources are loaded by `loadArgdown` of the entry point `arguebuf/argdown`,
 * since its parser is an optional peer dependency.
 */
export const suffixes: Readonly<Record<FileFormat, readonly string[]>> = {
  json: [".json"],
  brat: [".ann"],
  text: [".txt"],
  argdown: [".argdown", ".ad"],
};

/** File to load, e.g. a `File` of browsers and Node. */
export interface NamedFile {
  readonly name: string;
  text(): Promise<string>;
}

/** Split a file name at its last dot, a leading dot belongs to the stem like in Python. */
function splitName(name: string): [stem: string, suffix: string] {
  const dot = name.lastIndexOf(".");

  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
}

/** The format of a file given by the suffix of its name (case-insensitive), see `suffixes`. */
export function fileFormat(name: string): FileFormat | undefined {
  const suffix = splitName(name)[1].toLowerCase();

  return fileFormats.find((format) => suffixes[format].includes(suffix));
}

/**
 * Load a graph from a file whose format is derived from the suffix of its name (see `fileFormat`):
 * JSON (see `json`), brat standoff (see `brat`), and kialo exports or plain texts (see `text`).
 * The graph is named after the file without its suffix unless the format or `options.name` names it.
 * Throws for other suffixes, including those of Argdown sources.
 */
export async function file<S extends UserdataSchema = {}>(
  input: NamedFile,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): Promise<model.Graph<S>> {
  const format = fileFormat(input.name);

  if (format === undefined) {
    throw new Error(`The suffix of '${input.name}' is not supported.`);
  }

  if (format === "argdown") {
    throw new Error(
      `Argdown sources like '${input.name}' are loaded by 'loadArgdown' of 'arguebuf/argdown'.`,
    );
  }

  const content = await input.text();
  const graph = parse<S>(format, content, args);

  if (graph.name !== undefined) {
    return graph;
  }

  return graph.edit((draft) => {
    draft.name = splitName(input.name)[0];
  });
}

function parse<S extends UserdataSchema>(
  format: Exclude<FileFormat, "argdown">,
  content: string,
  args: helpers.LoadArgs<S, helpers.AifOptions>,
): model.Graph<S> {
  switch (format) {
    case "json": {
      const obj: JsonGraph = JSON.parse(content);

      return json<S>(obj, ...args);
    }
    case "brat":
      return brat<S>(content, ...args);
    case "text":
      return text<S>(content, ...args);
  }
}
