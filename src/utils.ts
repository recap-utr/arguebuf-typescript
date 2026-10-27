import {
  Analyst,
  AtomNode,
  Edge,
  Graph,
  Metadata,
  type Node,
  Participant,
  Reference,
  Resource,
  SchemeNode,
} from "./model/index.js";
import type { UserdataSchema } from "./model/userdata.js";

function copyMetadata(metadata: Metadata): Metadata {
  return new Metadata({ created: metadata.created, updated: metadata.updated });
}

function copyNode<S extends UserdataSchema>(node: Node<S>): Node<S> {
  const { id } = node;
  const metadata = copyMetadata(node.metadata);

  if (node.type === "scheme") {
    return new SchemeNode<S>({
      id,
      scheme: node.scheme,
      premiseDescriptors: node.premiseDescriptors,
      metadata,
      userdata: structuredClone(node.userdata),
    });
  }

  return new AtomNode<S>({
    id,
    text: node.text,
    reference: node.reference && new Reference(node.reference),
    participant: node.participant,
    metadata,
    userdata: structuredClone(node.userdata),
  });
}

/**
 * Create a deep copy of a graph without changing the input.
 *
 * Userdata is copied with `structuredClone` instead of its codec, so in-memory data is kept.
 * It must be structured-cloneable: typed arrays are copied, but class instances become plain objects.
 */
export function copy<S extends UserdataSchema>(graph: Graph<S>): Graph<S> {
  return new Graph<S>({
    name: graph.name,
    metadata: copyMetadata(graph.metadata),
    userdata: structuredClone(graph.userdata),
    resources: Object.values(graph.resources).map(
      (resource) =>
        new Resource<S>({
          id: resource.id,
          text: resource.text,
          title: resource.title,
          source: resource.source,
          timestamp: resource.timestamp,
          metadata: copyMetadata(resource.metadata),
          userdata: structuredClone(resource.userdata),
        }),
    ),
    participants: Object.values(graph.participants).map(
      (participant) =>
        new Participant<S>({
          id: participant.id,
          name: participant.name,
          username: participant.username,
          email: participant.email,
          url: participant.url,
          location: participant.location,
          description: participant.description,
          metadata: copyMetadata(participant.metadata),
          userdata: structuredClone(participant.userdata),
        }),
    ),
    analysts: Object.values(graph.analysts).map(
      (analyst) =>
        new Analyst<S>({
          id: analyst.id,
          name: analyst.name,
          email: analyst.email,
          userdata: structuredClone(analyst.userdata),
        }),
    ),
    nodes: Object.values(graph.nodes).map(copyNode),
    edges: Object.values(graph.edges).map(
      (edge) =>
        new Edge<S>({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          metadata: copyMetadata(edge.metadata),
          userdata: structuredClone(edge.userdata),
        }),
    ),
    majorClaim: graph.majorClaim,
  });
}
