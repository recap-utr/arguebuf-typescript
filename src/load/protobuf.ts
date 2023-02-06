import * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "../date.js";
import * as model from "../model/index.js";

function edgeFromProtobuf(
  id: string,
  obj: pb.Edge,
  nodes: { [key: string]: model.Node }
): model.Edge {
  return new model.Edge({
    id: id,
    source: nodes[obj.source],
    target: nodes[obj.target],
    metadata: new model.Metadata(),
  });
}

function nodeFromProtobuf(id: string, obj: pb.Node): model.Node {
  const timestamp = date.now();
  const metadata = new model.Metadata({
    created:
      obj.metadata?.created === undefined
        ? timestamp
        : date.fromProtobuf(obj.metadata?.created),
    updated:
      obj.metadata?.updated === undefined
        ? timestamp
        : date.fromProtobuf(obj.metadata?.updated),
  });
  if (obj.type.case === "atom") {
    return new model.AtomNode({
      id: id,
      text: obj.type.value.text,
      metadata: metadata,
      userdata: obj.userdata,
    });
  } else {
    return new model.SchemeNode({
      id: id,
      metadata: metadata,
      userdata: obj.userdata,
      premise_descriptors: obj.type.value?.premiseDescriptors,
      scheme: obj.type.value?.type,
    });
  }
}

export function protobuf(obj: pb.Graph): model.Graph {
  const timestamp = date.now();
  const nodes = Object.fromEntries(
    Object.entries(obj.nodes).map(([key, value]) => [
      key,
      nodeFromProtobuf(key, value),
    ])
  );
  const edges = Object.fromEntries(
    Object.entries(obj.edges).map(([key, value]) => [
      edgeFromProtobuf(key, value, nodes),
    ])
  );
  const analysts: { [key: string]: model.Analyst } = Object.fromEntries(
    Object.entries(obj.analysts).map(([key, value]) => [
      key,
      new model.Analyst({
        id: key,
        email: value.email,
        name: value.name,
        userdata: value.userdata,
      }),
    ])
  );
  const resources: { [key: string]: model.Resource } = Object.fromEntries(
    Object.entries(obj.resources).map(([key, value]) => [
      key,
      new model.Resource({
        text: value.text,
        id: key,
        source: value.source,
        metadata: new model.Metadata({
          created:
            value.metadata?.created === undefined
              ? timestamp
              : date.fromProtobuf(value.metadata?.created),
          updated:
            value.metadata?.updated === undefined
              ? timestamp
              : date.fromProtobuf(value.metadata?.updated),
        }),
        timestamp: date.fromProtobuf(value.timestamp),
        title: value.title,
        userdata: value.userdata,
      }),
    ])
  );
  const participants: { [key: string]: model.Participant } = Object.fromEntries(
    Object.entries(obj.participants).map(([key, value]) => [
      key,
      new model.Participant({
        id: key,
        description: value.description,
        email: value.email,
        location: value.location,
        name: value.name,
        url: value.url,
        username: value.username,
        metadata: new model.Metadata({
          created:
            value.metadata?.created === undefined
              ? timestamp
              : date.fromProtobuf(value.metadata?.created),
          updated:
            value.metadata?.updated === undefined
              ? timestamp
              : date.fromProtobuf(value.metadata?.updated),
        }),
        userdata: value.userdata,
      }),
    ])
  );
  return new model.Graph({
    nodes: nodes,
    edges: edges,
    analysts: analysts,
    majorClaim: obj.majorClaim,
    userdata: obj.userdata,
    resources: resources,
    metadata: new model.Metadata({
      created:
        obj.metadata?.created === undefined
          ? timestamp
          : date.fromProtobuf(obj.metadata?.created),
      updated:
        obj.metadata?.updated === undefined
          ? timestamp
          : date.fromProtobuf(obj.metadata?.updated),
    }),
    participants: participants,
  });
}
