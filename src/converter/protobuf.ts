import * as protobuf from "arg-services/graph/v1/graph_pb";
import { Edge } from "../model/edge.js";
import { AtomNode, Node, SchemeNode } from "../model/node.js";
import { Graph } from "../model/graph.js";
import { Metadata } from "../model/metadata.js";
import * as date from "../services/date.js";
import { Analyst, Participant, Resource } from "../index.js";

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

export function edgeFromProtobuf(
  id: string,
  obj: protobuf.Edge,
  nodes: { [key: string]: Node }
): Edge {
  return new Edge({
    id: id,
    source: nodes[obj.source],
    target: nodes[obj.target],
    metadata: new Metadata(),
  });
}

export function nodeFromProtobuf(id: string, obj: protobuf.Node): Node {
  const timestamp = date.now();
  const metadata = new Metadata({
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
    return new AtomNode({
      id: id,
      text: obj.type.value.text,
      metadata: metadata,
      userdata: obj.userdata,
    });
  } else {
    return new SchemeNode({
      id: id,
      metadata: metadata,
      userdata: obj.userdata,
      premise_descriptors: obj.type.value?.premiseDescriptors,
      scheme: obj.type.value?.type,
    });
  }
}

export function fromProtobuf(obj: protobuf.Graph): Graph {
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
  const analysts: { [key: string]: Analyst } = Object.fromEntries(
    Object.entries(obj.analysts).map(([key, value]) => [
      key,
      new Analyst({
        id: key,
        email: value.email,
        name: value.name,
        userdata: value.userdata,
      }),
    ])
  );
  const resources: { [key: string]: Resource } = Object.fromEntries(
    Object.entries(obj.resources).map(([key, value]) => [
      key,
      new Resource({
        text: value.text,
        id: key,
        source: value.source,
        metadata: new Metadata({
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
  const participants: { [key: string]: Participant } = Object.fromEntries(
    Object.entries(obj.participants).map(([key, value]) => [
      key,
      new Participant({
        id: key,
        description: value.description,
        email: value.email,
        location: value.location,
        name: value.name,
        url: value.url,
        username: value.username,
        metadata: new Metadata({
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
  return new Graph({
    nodes: nodes,
    edges: edges,
    analysts: analysts,
    majorClaim: obj.majorClaim,
    userdata: obj.userdata,
    resources: resources,
    metadata: new Metadata({
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
