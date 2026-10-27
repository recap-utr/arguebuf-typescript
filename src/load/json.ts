import { fromJson } from "@bufbuild/protobuf";
import { type GraphJson, GraphSchema } from "arg-services/graph/v1/graph_pb";
import type * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";
import type * as schemas from "#/schemas/index.js";
import { aif } from "#/load/aif.js";
import { argdown } from "#/load/argdown.js";
import * as helpers from "#/load/helpers.js";
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

function isXaif(obj: object): obj is schemas.xaif.Graph {
  return "AIF" in obj;
}

function isOva(obj: object): obj is schemas.ova.Graph {
  return "analysis" in obj;
}

function isSadface(obj: object): obj is schemas.sadface.Graph {
  return (
    "metadata" in obj &&
    typeof obj.metadata === "object" &&
    obj.metadata !== null &&
    "core" in obj.metadata
  );
}

function isAif(obj: object): obj is schemas.aif.Graph {
  return "nodes" in obj && Array.isArray(obj.nodes);
}

/**
 * Load a graph from a JSON object, detecting its format by its keys.
 *
 * The checks are applied in order: `AIF` (xAIF), `analysis` (OVA), `metadata.core` (SADFace),
 * `statements` with `arguments` and `relations` (Argdown JSON export),
 * a `nodes` array (AIF), and protobuf JSON otherwise.
 */
export function json<S extends UserdataSchema = {}>(
  obj: JsonGraph,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): model.Graph<S> {
  if (isXaif(obj)) {
    return xaif<S>(obj, ...args);
  }

  if (isOva(obj)) {
    return ova<S>(obj, ...args);
  }

  if (isSadface(obj)) {
    return sadface<S>(obj, ...args);
  }

  if (helpers.isArgdown(obj)) {
    return argdown<S>(obj, ...args);
  }

  if (isAif(obj)) {
    return aif<S>(obj, ...args);
  }

  return protobuf<S>(fromJson(GraphSchema, obj), ...args);
}
