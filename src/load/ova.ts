import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { isAifSchemeType } from "#/model/scheme.js";
import { dialogTypes } from "#/schemas/aif.js";
import * as ovaSchema from "#/schemas/ova.js";
import type { ResolvedCodecs, UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";
import { parseHtml } from "#/load/html.js";

/**
 * Load a graph from the OVA format (http://ova.uni-trier.de/).
 *
 * The resource text is the plain text of the highlighted `txt` (see `parseHtml`),
 * falling back to `plain_txt`.
 * Spans with the id `node<atom id>` become references with offsets into it.
 * Dialog nodes (L, TA, YA) are skipped silently, nodes of unknown types with a warning.
 * Descriptor values are atom ids as in ReCAP-OVA exports, stock OVA2 files store node texts or "-" there.
 * A `participantID` of 0 means no participant.
 * Numeric ids are stringified.
 * Throws an `invalid-input` error for structurally invalid input.
 */
export function ova<S extends UserdataSchema = {}>(
  obj: ovaSchema.Graph,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const ctx = helpers.loadOptions<S>(...args);
  const { name, codecs } = ctx;
  const graph = new model.GraphDraft<S>({ name, userdata: codecs.graph.decode({}) });
  const input = helpers.parseInput("OVA", ovaSchema.Graph, obj);
  const { analysis } = input;
  const [html, spans] = parseHtml(analysis.txt);
  const text = html || analysis.plain_txt;
  let resource: model.ResourceOf<S> | undefined;

  if (text) {
    resource = new model.Resource({
      text,
      title: analysis.documentTitle || undefined,
      source: analysis.documentSource || undefined,
      timestamp: date.parseOvaDate(analysis.documentDate),
      userdata: codecs.resource.decode({}),
    });
    graph.addResource(resource);
  }

  for (const participant of input.participants) {
    graph.addParticipant(
      helpers.newParticipant(codecs, participant.id, participant.firstname, participant.surname),
    );
  }

  if (analysis.annotatorName) {
    graph.addAnalyst(
      new model.Analyst({
        name: analysis.annotatorName,
        userdata: codecs.analyst.decode({}),
      }),
    );
  }

  // edges of skipped nodes are expected to be missing, unlike dangling ones
  const skipped = new Set<string>();

  for (const ovaNode of input.nodes) {
    if (ovaNode.type === "I") {
      const { id } = ovaNode;
      const span = spans.get(`node${id}`);
      const atom = atomFromOva(ovaNode, codecs, {
        participant: helpers.lookup(
          ctx,
          graph.participants,
          ovaNode.participantID,
          "participant",
          `atom node '${id}'`,
        )?.id,
        reference:
          resource === undefined || span === undefined
            ? undefined
            : new model.Reference({ text: span.text, resource: resource.id, offset: span.offset }),
      });

      helpers.addNode(graph, ctx, atom);

      if (ovaNode.majorClaim && graph.majorClaim === undefined) {
        graph.majorClaim = atom;
      }
    } else {
      const scheme = schemeFromOva(ovaNode, codecs);

      if (scheme !== undefined) {
        helpers.addNode(graph, ctx, scheme);
      } else {
        skipped.add(ovaNode.id);

        if (!dialogTypes.has(ovaNode.type)) {
          ctx.report(
            "unknown-element",
            `Skipping node '${ovaNode.id}' of unknown type '${ovaNode.type}'.`,
            [ovaNode.id],
          );
        }
      }
    }
  }

  for (const ovaEdge of input.edges) {
    const source = ovaEdge.from.id;
    const target = ovaEdge.to.id;
    helpers.addEdge(graph, ctx, { source, target, metadata: metadataFromOva(ovaEdge) }, skipped);
  }

  helpers.relocate(graph, ctx);

  return graph.freeze();
}

function metadataFromOva(obj: { date?: string | null }): model.Metadata {
  return new model.Metadata({ created: date.parseOva(obj.date) });
}

function schemeFromOva<S extends UserdataSchema>(
  obj: ovaSchema.NodeOutput,
  codecs: ResolvedCodecs<S>,
): model.SchemeNodeOf<S> | undefined {
  if (!isAifSchemeType(obj.type)) {
    return undefined;
  }

  return new model.SchemeNode({
    id: obj.id,
    scheme: model.resolveAifScheme(obj.type, obj.text),
    // descriptors map roles to atom ids, the conclusion is not a premise
    premiseDescriptors: Object.entries(obj.descriptors).flatMap(([role, id]) =>
      id === null || role.toLowerCase().startsWith("s_conclusion") ? [] : [id],
    ),
    metadata: metadataFromOva(obj),
    userdata: codecs.scheme.decode({}),
  });
}

function atomFromOva<S extends UserdataSchema>(
  obj: ovaSchema.NodeOutput,
  codecs: ResolvedCodecs<S>,
  links: Pick<model.AtomNodeInit, "participant" | "reference">,
): model.AtomNodeOf<S> {
  return new model.AtomNode({
    ...links,
    id: obj.id,
    text: obj.text,
    metadata: metadataFromOva(obj),
    userdata: codecs.atom.decode({}),
  });
}
