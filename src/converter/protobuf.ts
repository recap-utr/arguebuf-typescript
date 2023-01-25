import * as protobuf from "arg-services/graph/v1/graph_pb";
import { Edge } from "../model/edge.js";
import { Node } from "../model/node.js";
import { Graph } from "../model/graph.js";
import * as date from "../services/date.js";

export function edgeToProtobuf(edge: Edge): protobuf.Edge {
  return new protobuf.Edge({
    source: edge.source.id,
    target: edge.target.id,
    metadata: new protobuf.Metadata({
      created: date.toProtobuf(edge.metadata.created),
      updated: date.toProtobuf(edge.metadata.updated),
    }),
    userdata: edge.userdata,
  });
}

export function nodeToProtobuf(node: Node): protobuf.Node {
  if (node.type === "atom") {
    return new protobuf.Node({
      metadata: new protobuf.Metadata({
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: node.userdata,
      type: {
        value: new protobuf.Atom({
          text: node.text,
        }),
        case: "atom",
      },
    });
  } else {
    return new protobuf.Node({
      metadata: new protobuf.Metadata({
        created: date.toProtobuf(node.metadata.created),
        updated: date.toProtobuf(node.metadata.updated),
      }),
      userdata: node.userdata,
      type: {
        value: new protobuf.Scheme({
          premiseDescriptors: node.premise_descriptors,
          type: node.scheme,
        }),
        case: "scheme",
      },
    });
  }
}

export function toProtobuf(graph: Graph): protobuf.Graph {
  const edges: { [key: string]: protobuf.Edge } = Object.fromEntries(
    Object.values(graph.edges).map((e) => [e.id, edgeToProtobuf(e)])
  );
  const nodes: { [key: string]: protobuf.Node } = Object.fromEntries(
    Object.values(graph.nodes).map((n) => [n.id, nodeToProtobuf(n)])
  );
  const participants: { [key: string]: protobuf.Participant } =
    Object.fromEntries(
      Object.entries(graph.participants).map(([key, value]) => [
        key,
        new protobuf.Participant({
          name: value.name,
          description: value.description,
          email: value.email,
          location: value.location,
          metadata: new protobuf.Metadata({
            created: date.toProtobuf(value.metadata.created),
            updated: date.toProtobuf(value.metadata.updated),
          }),
          url: value.url,
          userdata: value.userdata,
          username: value.username,
        }),
      ])
    );
  const resources: { [key: string]: protobuf.Resource } = Object.fromEntries(
    Object.entries(graph.resources).map(([key, value]) => [
      key,
      new protobuf.Resource({
        source: value.source,
        text: value.text,
        timestamp:
          value.timestamp === undefined
            ? undefined
            : date.toProtobuf(value.timestamp),
        title: value.title,
        metadata: new protobuf.Metadata({
          created: date.toProtobuf(value.metadata.created),
          updated: date.toProtobuf(value.metadata.updated),
        }),
        userdata: value.userdata,
      }),
    ])
  );
  return new protobuf.Graph({
    nodes: nodes,
    edges: edges,
    schemaVersion: graph._schemaVersion,
    analysts: graph.analysts,
    libraryVersion: graph._libraryVersion,
    majorClaim: graph.majorClaim,
    metadata: new protobuf.Metadata({
      created: date.toProtobuf(graph.metadata.created),
      updated: date.toProtobuf(graph.metadata.updated),
    }),
    userdata: graph.userdata,
    participants: participants,
    resources: resources,
  });
}
