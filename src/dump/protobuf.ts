import * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "../date.js";
import * as model from "../model/index.js";

function edgeToProtobuf(edge: model.Edge): pb.Edge {
  return new pb.Edge({
    source: edge.source,
    target: edge.target,
    metadata: new pb.Metadata({
      created: date.toProtobuf(edge.metadata.created),
      updated: date.toProtobuf(edge.metadata.updated),
    }),
    userdata: edge.userdata,
  });
}

function nodeToProtobuf(node: model.Node): pb.Node {
  if (node.type === "atom") {
    return new pb.Node({
      metadata: new pb.Metadata({
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: node.userdata,
      type: {
        value: new pb.Atom({
          text: node.text,
        }),
        case: "atom",
      },
    });
  } else {
    return new pb.Node({
      metadata: new pb.Metadata({
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: node.userdata,
      type: {
        value: new pb.Scheme({
          premiseDescriptors: node.premise_descriptors,
          type: node.scheme,
        }),
        case: "scheme",
      },
    });
  }
}

export function protobuf(graph: model.Graph): pb.Graph {
  const edges: { [key: string]: pb.Edge } = Object.fromEntries(
    Object.values(graph.edges).map((e) => [e.id, edgeToProtobuf(e)])
  );
  const nodes: { [key: string]: pb.Node } = Object.fromEntries(
    Object.values(graph.nodes).map((n) => [n.id, nodeToProtobuf(n)])
  );
  const participants: { [key: string]: pb.Participant } = Object.fromEntries(
    Object.entries(graph.participants).map(([key, value]) => [
      key,
      new pb.Participant({
        name: value.name,
        description: value.description,
        email: value.email,
        location: value.location,
        metadata: new pb.Metadata({
          created: date.toProtobuf(value.metadata.created),
          updated: date.toProtobuf(value.metadata.updated),
        }),
        url: value.url,
        userdata: value.userdata,
        username: value.username,
      }),
    ])
  );
  const resources: { [key: string]: pb.Resource } = Object.fromEntries(
    Object.entries(graph.resources).map(([key, value]) => [
      key,
      new pb.Resource({
        source: value.source,
        text: value.text,
        timestamp:
          value.timestamp === undefined
            ? undefined
            : date.toProtobuf(value.timestamp),
        title: value.title,
        metadata: new pb.Metadata({
          created: date.toProtobuf(value.metadata.created),
          updated: date.toProtobuf(value.metadata.updated),
        }),
        userdata: value.userdata,
      }),
    ])
  );
  return new pb.Graph({
    nodes: nodes,
    edges: edges,
    schemaVersion: graph.schemaVersion,
    analysts: graph.analysts,
    libraryVersion: graph.libraryVersion,
    majorClaim: graph.majorClaim,
    metadata: new pb.Metadata({
      created: date.toProtobuf(graph.metadata.created),
      updated: date.toProtobuf(graph.metadata.updated),
    }),
    userdata: graph.userdata,
    participants: participants,
    resources: resources,
  });
}
