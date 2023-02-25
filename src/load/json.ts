import * as model from "../model/index.js";
import * as schemas from "../schemas/index.js";
import { aif as loadAif } from "./aif.js";
import { protobuf as loadProtobuf } from "./protobuf.js";

export function json(graph: { [key: string]: any }): model.Graph {
  if (graph.locutions !== undefined) {
    return loadAif(graph as schemas.aif.Graph);
  }

  return loadProtobuf(graph as schemas.protobuf.Graph);
}
