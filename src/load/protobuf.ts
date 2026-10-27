import type * as pb from "arg-services/graph/v1/graph_pb";
import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { isKnownScheme } from "#/model/scheme.js";
import type { ResolvedCodecs, UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";

function metadataFromProtobuf(obj: pb.Metadata | undefined): model.Metadata {
  return new model.Metadata({
    created: date.fromProtobuf(obj?.created),
    updated: date.fromProtobuf(obj?.updated),
  });
}

function nodeFromProtobuf<S extends UserdataSchema>(
  id: string,
  obj: pb.Node,
  graph: model.Graph<S>,
  codecs: ResolvedCodecs<S>,
): model.Node<S> {
  const metadata = metadataFromProtobuf(obj.metadata);
  const userdata = obj.userdata ?? {};

  switch (obj.type.case) {
    case "atom": {
      const { text, participant, reference } = obj.type.value;
      const owner = `atom node '${id}'`;

      return new model.AtomNode<S>({
        id,
        text,
        participant: helpers.lookup(graph.participants, participant, "participant", owner)?.id,
        reference:
          reference &&
          helpers.newReference(
            reference.text,
            reference.resource,
            reference.offset,
            graph.resources,
            owner,
          ),
        metadata,
        userdata: codecs.atom.decode(userdata),
      });
    }
    case "scheme": {
      const scheme = obj.type.value.type;

      if (!isKnownScheme(scheme)) {
        throw new Error(`Node '${id}' has the unknown ${scheme.case} scheme ${scheme.value}.`);
      }

      return new model.SchemeNode<S>({
        id,
        scheme,
        premiseDescriptors: obj.type.value.premiseDescriptors,
        metadata,
        userdata: codecs.scheme.decode(userdata),
      });
    }
    case undefined:
      throw new Error(`Node '${id}' is neither an atom nor a scheme.`);
  }
}

/** Load a graph from a protobuf message. */
export function protobuf<S extends UserdataSchema = {}>(
  obj: pb.Graph,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const { name, codecs } = helpers.loadOptions<S>(...args);
  const graph = new model.Graph<S>({
    name,
    metadata: metadataFromProtobuf(obj.metadata),
    userdata: codecs.graph.decode(obj.userdata ?? {}),
  });

  for (const [id, resource] of Object.entries(obj.resources)) {
    graph.addResource(
      new model.Resource<S>({
        id,
        text: resource.text,
        title: resource.title,
        source: resource.source,
        timestamp: date.fromProtobuf(resource.timestamp),
        metadata: metadataFromProtobuf(resource.metadata),
        userdata: codecs.resource.decode(resource.userdata ?? {}),
      }),
    );
  }

  for (const [id, participant] of Object.entries(obj.participants)) {
    graph.addParticipant(
      new model.Participant<S>({
        id,
        name: participant.name || undefined,
        username: participant.username,
        email: participant.email,
        url: participant.url,
        location: participant.location,
        description: participant.description,
        metadata: metadataFromProtobuf(participant.metadata),
        userdata: codecs.participant.decode(participant.userdata ?? {}),
      }),
    );
  }

  for (const [id, analyst] of Object.entries(obj.analysts)) {
    graph.addAnalyst(
      new model.Analyst<S>({
        id,
        name: analyst.name || undefined,
        email: analyst.email || undefined,
        userdata: codecs.analyst.decode(analyst.userdata ?? {}),
      }),
    );
  }

  for (const [id, node] of Object.entries(obj.nodes)) {
    graph.addNode(nodeFromProtobuf(id, node, graph, codecs));
  }

  for (const [id, edge] of Object.entries(obj.edges)) {
    helpers.addEdge(graph, codecs, {
      id,
      source: edge.source,
      target: edge.target,
      metadata: metadataFromProtobuf(edge.metadata),
      userdata: edge.userdata,
    });
  }

  const majorClaim = helpers.lookup(graph.atomNodes, obj.majorClaim, "major claim", "the graph");

  if (majorClaim !== undefined) {
    graph.majorClaim = majorClaim;
  }

  return graph;
}
