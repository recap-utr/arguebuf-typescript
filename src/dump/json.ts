import type { JsonObject } from "../model";
import * as model from "../model/index.js";
import { aif as dumpAif } from "./aif.js";
import { protobuf as dumpProtobuf } from "./protobuf.js";

export function json(
  graph: model.GraphInterface,
  format: "aif" | "arguebuf",
): JsonObject {
  if (format === "aif") {
    return dumpAif(graph);
  }

  return dumpProtobuf(graph).toJson() as JsonObject;
}
