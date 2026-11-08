import type { GraphView } from "#/model/graph.js";
import { isDefaultScheme, schemeValueLabel } from "#/model/scheme.js";
import type { UserdataSchema } from "#/model/userdata.js";
import type { Outline } from "#/patch/schema.js";

/** The graph in the shape of the created elements of a patch. */
export function outline<S extends UserdataSchema>(graph: GraphView<S>): Outline {
  const nodes = Object.values(graph.nodes);

  return {
    resources: Object.values(graph.resources).map(({ id, title, source }) => ({
      id,
      title: title ?? null,
      source: source ?? null,
    })),
    participants: Object.values(graph.participants).map((participant) => ({
      id: participant.id,
      name: participant.name ?? null,
      username: participant.username ?? null,
      email: participant.email ?? null,
      url: participant.url ?? null,
      location: participant.location ?? null,
      description: participant.description ?? null,
    })),
    atoms: nodes
      .filter((node) => node.type === "atom")
      .map((node) => ({
        id: node.id,
        text: node.text,
        resource: node.reference?.resource ?? null,
        participant: node.participant ?? null,
      })),
    schemes: nodes
      .filter((node) => node.type === "scheme")
      .map(({ id, scheme }) => ({
        id,
        type: scheme.case ?? null,
        scheme:
          scheme.case === undefined || isDefaultScheme(scheme) ? null : schemeValueLabel(scheme),
        premises: graph.premiseNodes(id).map((node) => node.id),
        conclusion: graph.outgoingNodes(id)[0]?.id ?? null,
      })),
    majorClaim: graph.majorClaim ?? null,
  };
}
