import * as protoModel from "arg-services/graph/v1/graph_pb";
import * as model from "../model/index.js";
import * as schemas from "../schemas/index.js";
import { aif as loadAif } from "./aif.js";
import { protobuf as loadProtobuf } from "./protobuf.js";

type JSONObject = { [key: string]: any };

export function json(graph: JSONObject): model.Graph {
  if (graph.locutions !== undefined) {
    return loadAif(graph as schemas.aif.Graph);
  }

  return loadProtobuf(protoModel.Graph.fromJson(graph));
}
