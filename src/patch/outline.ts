import type { GraphView } from "#/model/graph.js";
import { isDefaultScheme, schemeValueLabel } from "#/model/scheme.js";
import type { UserdataSchema } from "#/model/userdata.js";
import { premiseIds } from "#/patch/ids.js";
import { type Outline, participantFields } from "#/patch/schema.js";

/** The graph in the shape of a patch, e.g. to show it to an agent. */
export function outline<S extends UserdataSchema>(graph: GraphView<S>): Outline {
  const nodes = Object.values(graph.nodes);

  return {
    resources: Object.values(graph.resources).map(({ id, title, source }) => ({
      id,
      title,
      source,
    })),
    participants: Object.values(graph.participants).map((participant) => ({
      id: participant.id,
      ...Object.fromEntries(participantFields.map((key) => [key, participant[key]])),
    })),
    atoms: nodes
      .filter((node) => node.type === "atom")
      .map((node) => ({
        id: node.id,
        text: node.text,
        resource: node.reference?.resource,
        participant: node.participant,
      })),
    schemes: nodes
      .filter((node) => node.type === "scheme")
      .map(({ id, scheme }) => ({
        id,
        type: scheme.case,
        scheme:
          scheme.case === undefined || isDefaultScheme(scheme)
            ? undefined
            : schemeValueLabel(scheme),
        premises: premiseIds(graph, id),
        conclusion: graph.outgoingNodes(id)[0]?.id,
      })),
    majorClaim: graph.majorClaim,
  };
}
