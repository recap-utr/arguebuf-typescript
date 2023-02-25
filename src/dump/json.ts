import * as model from "../model/index.js";
import { aif as dumpAif } from "./aif.js";
import { protobuf as dumpProtobuf } from "./protobuf.js";

type JSONObject = { [key: string]: any };

export function json(
  graph: model.Graph,
  format: "aif" | "arguebuf"
): JSONObject {
  if (format === "aif") {
    return dumpAif(graph);
  }

  return dumpProtobuf(graph).toJson() as JSONObject;
}
