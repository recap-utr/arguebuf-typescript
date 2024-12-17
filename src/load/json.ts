import { fromJson } from "@bufbuild/protobuf";
import { type GraphJson, GraphSchema } from "arg-services/graph/v1/graph_pb";
import * as model from "../model/index.js";
import * as schemas from "../schemas/index.js";
import { aif as loadAif } from "./aif.js";
import { protobuf as loadProtobuf } from "./protobuf.js";

export function json(graph: unknown): model.Graph {
  if (typeof graph === "object" && graph !== null && "locutions" in graph) {
    return loadAif(graph as schemas.aif.Graph);
  }

  return loadProtobuf(fromJson(GraphSchema, graph as GraphJson));
}
