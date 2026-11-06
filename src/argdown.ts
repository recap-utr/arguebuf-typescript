import {
  ArgdownApplication,
  DataPlugin,
  ModelPlugin,
  ParserPlugin,
  isObject,
  stringifyArgdownData,
} from "@argdown/core";
import { argdown } from "#/load/argdown.js";
import type { LoadArgs } from "#/load/helpers.js";
import type { Graph } from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";

const app = new ArgdownApplication();
app.addPlugin(new ParserPlugin(), "parse-input");
app.addPlugin(new DataPlugin(), "build-model");
app.addPlugin(new ModelPlugin(), "build-model");

const settings = { logLevel: "silent", logExceptions: false, throwExceptions: true };

/** Load a graph from Argdown source text, throwing on syntax errors. */
export function loadArgdown<S extends UserdataSchema = {}>(
  text: string,
  ...args: LoadArgs<S>
): Graph<S> {
  const response = app.run({ ...settings, input: text, process: ["parse-input"] });
  const errors = [
    ...(response.lexerErrors ?? []).map((e) => `${e.line}:${e.column} ${e.message}`),
    ...(response.parserErrors ?? []).map(
      (e) => `${e.token.startLine}:${e.token.startColumn} ${e.message}`,
    ),
  ];

  if (errors.length > 0) {
    throw new Error(`Invalid Argdown input:\n${errors.join("\n")}`);
  }

  const {
    statements,
    arguments: argumentMap,
    relations,
    frontMatter,
  } = app.run({ ...settings, process: ["build-model"] }, response);
  // Same serialization as the upstream JSON export, the front matter is not part of it
  const data = stringifyArgdownData({ statements, arguments: argumentMap, relations });

  // validated by the loader
  return argdown<S>(
    { ...JSON.parse(data), frontMatter: isObject(frontMatter) ? frontMatter : undefined },
    ...args,
  );
}
