import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import * as model from "../model";

export { fromAif, fromProtobuf, toAif } from "../model";

export function importGraph(obj: any): model.Wrapper {
  if ("locutions" in obj) {
    return model.fromAif(obj);
  } else {
    return model.fromProtobuf(json2proto(obj));
  }
}

export function proto2json(graph: arguebuf.Graph): JsonObject {
  return arguebuf.Graph.toJson(graph) as JsonObject;
}

export function json2proto(graph: JsonObject): arguebuf.Graph {
  return arguebuf.Graph.fromJson(graph);
}

export function toProtobuf(obj: model.Wrapper): arguebuf.Graph {
  return model.toProtobuf(obj);
}
