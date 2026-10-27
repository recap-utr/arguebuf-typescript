import { toJson } from "@bufbuild/protobuf";
import { type GraphJson, GraphSchema } from "arg-services/graph/v1/graph_pb";
import type * as model from "#/model/index.js";
import type { CodecArgs, UserdataSchema } from "#/model/userdata.js";
import type * as aifSchema from "#/schemas/aif.js";
import type * as xaifSchema from "#/schemas/xaif.js";
import { aif } from "#/dump/aif.js";
import { protobuf } from "#/dump/protobuf.js";
import { xaif } from "#/dump/xaif.js";

/** JSON objects by export format. */
export interface Formats {
  arguebuf: GraphJson;
  aif: aifSchema.Graph;
  xaif: xaifSchema.Graph;
}

export type Format = keyof Formats;

/** Formats without userdata. */
type PlainFormat = Exclude<Format, "arguebuf">;

function isPlainFormat(args: readonly unknown[]): args is [PlainFormat] {
  return typeof args[0] === "string";
}

/**
 * Export a graph to a JSON object, by default as protobuf JSON with userdata encoded by the codecs.
 * AIF and xAIF do not contain userdata, so they need no codecs.
 */
export function json<S extends UserdataSchema>(
  graph: model.Graph<S>,
  ...args: CodecArgs<S>
): GraphJson;
export function json<S extends UserdataSchema, F extends PlainFormat>(
  graph: model.Graph<S>,
  format: F,
): Formats[F];
export function json<S extends UserdataSchema>(
  graph: model.Graph<S>,
  ...args: CodecArgs<S> | [PlainFormat]
): Formats[Format] {
  if (isPlainFormat(args)) {
    return args[0] === "aif" ? aif(graph) : xaif(graph);
  }

  return toJson(GraphSchema, protobuf(graph, ...args));
}
