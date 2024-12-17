import { toJson } from "@bufbuild/protobuf";
import { GraphSchema } from "arg-services/graph/v1/graph_pb";
import * as model from "../model/index.js";
import { aif as dumpAif } from "./aif.js";
import { protobuf as dumpProtobuf } from "./protobuf.js";

export function json(
  graph: model.GraphInterface,
  format: "aif" | "arguebuf",
): unknown {
  if (format === "aif") {
    return dumpAif(graph);
  }

  return toJson(GraphSchema, dumpProtobuf(graph));
}
