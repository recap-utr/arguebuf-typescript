import { create, type JsonObject } from "@bufbuild/protobuf";
import { version as libraryVersion } from "arg-services";
import * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "../date.js";
import * as model from "../model/index.js";

function edgeToProtobuf(edge: model.EdgeInterface): pb.Edge {
  return create(pb.EdgeSchema, {
    source: edge.source,
    target: edge.target,
    metadata: create(pb.MetadataSchema, {
      created: date.toProtobuf(edge.metadata.created),
      updated: date.toProtobuf(edge.metadata.updated),
    }),
    userdata: edge.userdata as JsonObject,
  });
}

function nodeToProtobuf(node: model.NodeInterface): pb.Node {
  if (node.type === "atom") {
    return create(pb.NodeSchema, {
      metadata: create(pb.MetadataSchema, {
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: node.userdata as JsonObject,
      type: {
        value: create(pb.AtomSchema, {
          text: node.text,
          participant: node.participant,
          reference: node.reference
            ? create(pb.ReferenceSchema, {
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
    return create(pb.NodeSchema, {
      metadata: create(pb.MetadataSchema, {
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: node.userdata as JsonObject,
      type: {
        value: create(pb.SchemeSchema, {
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
  const analysts: Record<string, pb.Analyst> = Object.fromEntries(
    Object.entries(graph.analysts).map(([key, value]) => [
      key,
      create(pb.AnalystSchema, {
        name: value.name,
        email: value.email,
        userdata: value.userdata as JsonObject,
      }),
    ]),
  );
  const participants: Record<string, pb.Participant> = Object.fromEntries(
    Object.entries(graph.participants).map(([key, value]) => [
      key,
      create(pb.ParticipantSchema, {
        name: value.name,
        description: value.description,
        email: value.email,
        location: value.location,
        metadata: create(pb.MetadataSchema, {
          created: date.toProtobuf(value.metadata.created),
          updated: date.toProtobuf(value.metadata.updated),
        }),
        url: value.url,
        userdata: value.userdata as JsonObject,
        username: value.username,
      }),
    ]),
  );
  const resources: Record<string, pb.Resource> = Object.fromEntries(
    Object.entries(graph.resources).map(([key, value]) => [
      key,
      create(pb.ResourceSchema, {
        source: value.source,
        text: value.text,
        timestamp:
          value.timestamp === undefined
            ? undefined
            : date.toProtobuf(value.timestamp),
        title: value.title,
        metadata: create(pb.MetadataSchema, {
          created: date.toProtobuf(value.metadata.created),
          updated: date.toProtobuf(value.metadata.updated),
        }),
        userdata: value.userdata as JsonObject,
      }),
    ]),
  );
  return create(pb.GraphSchema, {
    nodes: nodes,
    edges: edges,
    schemaVersion: 1,
    analysts: analysts,
    libraryVersion: libraryVersion,
    majorClaim: graph.majorClaim,
    metadata: create(pb.MetadataSchema, {
      created: date.toProtobuf(graph.metadata.created),
      updated: date.toProtobuf(graph.metadata.updated),
    }),
    userdata: graph.userdata as JsonObject,
    participants: participants,
    resources: resources,
  });
}
