import { Struct } from "@bufbuild/protobuf";
import { version as libraryVersion } from "arg-services";
import * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "../date.js";
import * as model from "../model/index.js";

function edgeToProtobuf(edge: model.EdgeInterface): pb.Edge {
  return new pb.Edge({
    source: edge.source,
    target: edge.target,
    metadata: new pb.Metadata({
      created: date.toProtobuf(edge.metadata.created),
      updated: date.toProtobuf(edge.metadata.updated),
    }),
    userdata: Struct.fromJson(edge.userdata),
  });
}

function nodeToProtobuf(node: model.NodeInterface): pb.Node {
  if (node.type === "atom") {
    return new pb.Node({
      metadata: new pb.Metadata({
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: Struct.fromJson(node.userdata),
      type: {
        value: new pb.Atom({
          text: node.text,
          participant: node.participant,
          reference: node.reference
            ? new pb.Reference({
                offset: node.reference.offset,
                resource: node.reference.resource,
                text: node.reference.text,
              })
            : undefined,
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
      userdata: Struct.fromJson(node.userdata),
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

export function protobuf(graph: model.GraphInterface): pb.Graph {
  const edges: Record<string, pb.Edge> = Object.fromEntries(
    Object.values(graph.edges).map((e) => [e.id, edgeToProtobuf(e)]),
  );
  const nodes: Record<string, pb.Node> = Object.fromEntries(
    Object.values(graph.nodes).map((n) => [n.id, nodeToProtobuf(n)]),
  );
  const participants: Record<string, pb.Participant> = Object.fromEntries(
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
        userdata: Struct.fromJson(value.userdata),
        username: value.username,
      }),
    ]),
  );
  const resources: Record<string, pb.Resource> = Object.fromEntries(
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
        userdata: Struct.fromJson(value.userdata),
      }),
    ]),
  );
  return new pb.Graph({
    nodes: nodes,
    edges: edges,
    schemaVersion: 1,
    analysts: graph.analysts,
    libraryVersion: libraryVersion,
    majorClaim: graph.majorClaim,
    metadata: new pb.Metadata({
      created: date.toProtobuf(graph.metadata.created),
      updated: date.toProtobuf(graph.metadata.updated),
    }),
    userdata: Struct.fromJson(graph.userdata),
    participants: participants,
    resources: resources,
  });
}
