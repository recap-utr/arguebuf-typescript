import {
  ArgdownApplication,
  DataPlugin,
  ModelPlugin,
  ParserPlugin,
  isObject,
  stringifyArgdownData,
} from "@argdown/core";
import type { JsonValue } from "@bufbuild/protobuf";
import { argdown } from "#/load/argdown.js";
import { isArgdown, type LoadArgs } from "#/load/helpers.js";
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
  // Same serialization as the upstream JSON export, extended by the front matter object
  const data: JsonValue = JSON.parse(
    stringifyArgdownData({
      statements,
      arguments: argumentMap,
      relations,
      frontMatter: isObject(frontMatter) ? frontMatter : undefined,
    }),
  );

  if (typeof data !== "object" || data === null || !isArgdown(data)) {
    throw new Error("The Argdown model lacks statements, arguments, or relations.");
  }

  return argdown<S>(data, ...args);
}
