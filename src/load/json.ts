import { fromJson } from "@bufbuild/protobuf";
import { type GraphJson, GraphSchema } from "arg-services/graph/v1/graph_pb";
import { fail } from "#/issue.js";
import type * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";
import * as schemas from "#/schemas/index.js";
import { aif } from "#/load/aif.js";
import { argdown } from "#/load/argdown.js";
import type * as helpers from "#/load/helpers.js";
import { ova } from "#/load/ova.js";
import { protobuf } from "#/load/protobuf.js";
import { sadface } from "#/load/sadface.js";
import { xaif } from "#/load/xaif.js";

/** JSON objects of the supported formats. */
export type JsonGraph =
  | GraphJson
  | schemas.aif.Graph
  | schemas.argdown.Graph
  | schemas.ova.Graph
  | schemas.sadface.Graph
  | schemas.xaif.Graph;

const has = (value: unknown, key: string): boolean =>
  typeof value === "object" && value !== null && key in value;

const isXaif = (obj: JsonGraph): obj is schemas.xaif.Graph => has(obj, "AIF");
const isOva = (obj: JsonGraph): obj is schemas.ova.Graph => has(obj, "analysis");
const isSadface = (obj: JsonGraph): obj is schemas.sadface.Graph =>
  has(Reflect.get(obj, "metadata"), "core");
const isArgdown = (obj: JsonGraph): obj is schemas.argdown.Graph =>
  has(obj, "statements") && has(obj, "arguments") && has(obj, "relations");
const isAif = (obj: JsonGraph): obj is schemas.aif.Graph =>
  Array.isArray(Reflect.get(obj, "nodes"));

/**
 * Load a graph from a JSON object, detecting its format by its keys.
 *
 * The checks are applied in order: `AIF` (xAIF), `analysis` (OVA), `metadata.core` (SADFace),
 * `statements` with `arguments` and `relations` (Argdown JSON export),
 * a `nodes` array (AIF), and protobuf JSON otherwise.
 * Input that has the keys of a format but is otherwise invalid throws an `invalid-input` error.
 */
export function json<S extends UserdataSchema = {}>(
  obj: JsonGraph,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): model.Graph<S> {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return fail("invalid-input", "The input is not a JSON object.");
  }

  if (isXaif(obj)) {
    return xaif<S>(obj, ...args);
  }

  if (isOva(obj)) {
    return ova<S>(obj, ...args);
  }

  if (isSadface(obj)) {
    return sadface<S>(obj, ...args);
  }

  if (isArgdown(obj)) {
    return argdown<S>(obj, ...args);
  }

  if (isAif(obj)) {
    return aif<S>(obj, ...args);
  }

  return protobuf<S>(fromJson(GraphSchema, obj), ...args);
}
