import * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "../date.js";
import type { JsonObject } from "../model";
import * as model from "../model/index.js";

function metadataFromProtobuf(obj?: pb.Metadata): model.Metadata | undefined {
  const timestamp = date.now();
  return new model.Metadata({
    created:
      obj?.created === undefined ? timestamp : date.fromProtobuf(obj?.created),
    updated:
      obj?.updated === undefined ? timestamp : date.fromProtobuf(obj?.updated),
  });
}

function edgeFromProtobuf(id: string, obj: pb.Edge): model.Edge {
  return new model.Edge({
    id: id,
    source: obj.source,
    target: obj.target,
    metadata: metadataFromProtobuf(obj.metadata),
  });
}

function nodeFromProtobuf(id: string, obj: pb.Node): model.Node {
  if (obj.type.case === "atom") {
    return new model.AtomNode({
      id: id,
      text: obj.type.value.text,
      metadata: metadataFromProtobuf(obj.metadata),
      userdata: obj.userdata?.toJson() as JsonObject,
      participant: obj.type.value.participant,
      reference: obj.type.value.reference
        ? new model.Reference({
            text: obj.type.value.reference.text,
            offset: obj.type.value.reference.offset,
            resource: obj.type.value.reference.resource,
          })
        : undefined,
    });
  } else {
    return new model.SchemeNode({
      id: id,
      metadata: metadataFromProtobuf(obj.metadata),
      userdata: obj.userdata?.toJson() as JsonObject,
      premise_descriptors: obj.type.value?.premiseDescriptors,
      scheme: obj.type.value?.type,
    });
  }
}

export function protobuf(obj: pb.Graph): model.Graph {
  const nodes: Array<model.Node> = Object.entries(obj.nodes).map(
    ([key, value]) => nodeFromProtobuf(key, value)
  );
  const edges: Array<model.Edge> = Object.entries(obj.edges).map(
    ([key, value]) => edgeFromProtobuf(key, value)
  );
  const analysts: Array<model.Analyst> = Object.entries(obj.analysts).map(
    ([key, value]) =>
      new model.Analyst({
        id: key,
        email: value.email,
        name: value.name,
        userdata: value.userdata?.toJson() as JsonObject,
      })
  );
  const resources: Array<model.Resource> = Object.entries(obj.resources).map(
    ([key, value]) =>
      new model.Resource({
        text: value.text,
        id: key,
        source: value.source,
        metadata: metadataFromProtobuf(value.metadata),
        timestamp: date.fromProtobuf(value.timestamp),
        title: value.title,
        userdata: value.userdata?.toJson() as JsonObject,
      })
  );
  const participants: Array<model.Participant> = Object.entries(
    obj.participants
  ).map(
    ([key, value]) =>
      new model.Participant({
        id: key,
        description: value.description,
        email: value.email,
        location: value.location,
        name: value.name,
        url: value.url,
        username: value.username,
        metadata: metadataFromProtobuf(value.metadata),
        userdata: value.userdata?.toJson() as JsonObject,
      })
  );
  return new model.Graph({
    nodes: nodes,
    edges: edges,
    analysts: analysts,
    majorClaim: obj.majorClaim,
    userdata: obj.userdata?.toJson() as JsonObject,
    resources: resources,
    metadata: metadataFromProtobuf(obj.metadata),
    participants: participants,
  });
}
