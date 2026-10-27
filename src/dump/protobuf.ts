import { create } from "@bufbuild/protobuf";
import * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "../date.js";
import type { JsonObject } from "@bufbuild/protobuf";
import type * as model from "../model/index.js";
import {
  type Codec,
  type CodecArgs,
  type ResolvedCodecs,
  resolveCodecs,
  type UserdataSchema,
} from "../model/userdata.js";
import pkg from "../../package.json" with { type: "json" };

const LIBRARY_VERSION = `arguebuf-typescript:${pkg.version}`;
const SCHEMA_VERSION = 1;

// empty userdata is omitted
function userdataToProtobuf<T>(codec: Codec<T>, userdata: T): JsonObject | undefined {
  const data = codec.encode(userdata);

  return Object.keys(data).length > 0 ? data : undefined;
}

function metadataToProtobuf(metadata: model.Metadata): pb.Metadata {
  return create(pb.MetadataSchema, {
    created: date.toProtobuf(metadata.created),
    updated: date.toProtobuf(metadata.updated),
  });
}

function nodeToProtobuf<S extends UserdataSchema>(
  node: model.Node<S>,
  codecs: ResolvedCodecs<S>,
): pb.Node {
  const metadata = metadataToProtobuf(node.metadata);

  if (node.type === "atom") {
    return create(pb.NodeSchema, {
      metadata,
      userdata: userdataToProtobuf(codecs.atom, node.userdata),
      type: {
        case: "atom",
        value: create(pb.AtomSchema, {
          text: node.text,
          participant: node.participant,
          reference:
            node.reference &&
            create(pb.ReferenceSchema, {
              text: node.reference.text,
              resource: node.reference.resource,
              offset: node.reference.offset,
            }),
        }),
      },
    });
  }

  return create(pb.NodeSchema, {
    metadata,
    userdata: userdataToProtobuf(codecs.scheme, node.userdata),
    type: {
      case: "scheme",
      value: create(pb.SchemeSchema, {
        type: { ...node.scheme },
        premiseDescriptors: [...node.premiseDescriptors],
      }),
    },
  });
}

/**
 * Export a graph to a protobuf message, writing the library and schema version.
 * Userdata is encoded by the codec of its kind, the codecs are required if `S` customizes userdata.
 */
export function protobuf<S extends UserdataSchema>(
  graph: model.Graph<S>,
  ...[options]: CodecArgs<S>
): pb.Graph {
  const codecs = resolveCodecs(options?.codecs);
  const entries = <T, U>(record: Readonly<Record<string, T>>, convert: (value: T) => U) =>
    Object.fromEntries(Object.entries(record).map(([id, value]) => [id, convert(value)]));

  return create(pb.GraphSchema, {
    schemaVersion: SCHEMA_VERSION,
    libraryVersion: LIBRARY_VERSION,
    metadata: metadataToProtobuf(graph.metadata),
    userdata: userdataToProtobuf(codecs.graph, graph.userdata),
    majorClaim: graph.majorClaim,
    nodes: entries(graph.nodes, (node) => nodeToProtobuf(node, codecs)),
    edges: entries(graph.edges, (edge) =>
      create(pb.EdgeSchema, {
        source: edge.source,
        target: edge.target,
        metadata: metadataToProtobuf(edge.metadata),
        userdata: userdataToProtobuf(codecs.edge, edge.userdata),
      }),
    ),
    resources: entries(graph.resources, (resource) =>
      create(pb.ResourceSchema, {
        text: resource.text,
        title: resource.title,
        source: resource.source,
        timestamp: resource.timestamp && date.toProtobuf(resource.timestamp),
        metadata: metadataToProtobuf(resource.metadata),
        userdata: userdataToProtobuf(codecs.resource, resource.userdata),
      }),
    ),
    participants: entries(graph.participants, (participant) =>
      create(pb.ParticipantSchema, {
        name: participant.name,
        username: participant.username,
        email: participant.email,
        url: participant.url,
        location: participant.location,
        description: participant.description,
        metadata: metadataToProtobuf(participant.metadata),
        userdata: userdataToProtobuf(codecs.participant, participant.userdata),
      }),
    ),
    analysts: entries(graph.analysts, (analyst) =>
      create(pb.AnalystSchema, {
        name: analyst.name,
        email: analyst.email,
        userdata: userdataToProtobuf(codecs.analyst, analyst.userdata),
      }),
    ),
  });
}
