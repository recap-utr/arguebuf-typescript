import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { isAifSchemeType } from "#/model/scheme.js";
import { DIALOG_TYPES } from "#/schemas/aif.js";
import type * as ovaSchema from "#/schemas/ova.js";
import type { ResolvedCodecs, UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";
import { parseHtml } from "#/load/html.js";

/**
 * Load a graph from the OVA format (http://ova.uni-trier.de/).
 *
 * The resource text is the plain text of the highlighted `txt` (see `parseHtml`),
 * falling back to `plain_txt`.
 * Spans with the id `node<atom id>` become references with offsets into it.
 * Dialog nodes (L, TA, YA) and their edges are skipped.
 * Numeric ids are stringified.
 */
export function ova<S extends UserdataSchema = {}>(
  obj: ovaSchema.Graph,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const { name, codecs } = helpers.loadOptions<S>(...args);
  const graph = new model.Graph<S>({ name, userdata: codecs.graph.decode({}) });
  const { analysis } = obj;
  const [html, spans] = parseHtml(analysis.txt || "");
  const text = html || analysis.plain_txt;
  let resource: model.Resource<S> | undefined;

  if (text) {
    resource = new model.Resource<S>({
      text,
      title: analysis.documentTitle || undefined,
      source: analysis.documentSource || undefined,
      timestamp: date.parseOvaDate(analysis.documentDate),
      userdata: codecs.resource.decode({}),
    });
    graph.addResource(resource);
  }

  for (const participant of obj.participants) {
    graph.addParticipant(
      helpers.newParticipant(
        codecs,
        helpers.stringId(participant.id),
        participant.firstname,
        participant.surname,
      ),
    );
  }

  if (analysis.annotatorName) {
    graph.addAnalyst(
      new model.Analyst<S>({
        name: analysis.annotatorName,
        userdata: codecs.analyst.decode({}),
      }),
    );
  }

  // edges of skipped dialog nodes are expected to be missing, unlike dangling ones
  const dialog = new Set<string>();

  for (const ovaNode of obj.nodes) {
    if (DIALOG_TYPES.has(ovaNode.type)) {
      dialog.add(helpers.stringId(ovaNode.id));
    }

    if (ovaNode.type === "I") {
      const atom = atomFromOva(ovaNode, codecs);
      const span = spans.get(`node${atom.id}`);
      atom.participant = helpers.lookup(
        graph.participants,
        ovaNode.participantID,
        "participant",
        `atom node '${atom.id}'`,
      )?.id;

      if (resource !== undefined && span !== undefined) {
        atom.reference = new model.Reference({
          text: span.text,
          resource: resource.id,
          offset: span.offset,
        });
      }

      graph.addNode(atom);

      if (ovaNode.majorClaim && graph.majorClaim === undefined) {
        graph.majorClaim = atom;
      }
    } else {
      const scheme = schemeFromOva(ovaNode, codecs);

      if (scheme !== undefined) {
        graph.addNode(scheme);
      }
    }
  }

  for (const ovaEdge of obj.edges) {
    const source = helpers.stringId(ovaEdge.from.id);
    const target = helpers.stringId(ovaEdge.to.id);
    helpers.addEdge(graph, codecs, { source, target, metadata: metadataFromOva(ovaEdge) }, dialog);
  }

  return graph;
}

function metadataFromOva(obj: { date?: string | null }): model.Metadata {
  return new model.Metadata({ created: date.parseOva(obj.date) });
}

function schemeFromOva<S extends UserdataSchema>(
  obj: ovaSchema.Node,
  codecs: ResolvedCodecs<S>,
): model.SchemeNode<S> | undefined {
  if (!isAifSchemeType(obj.type)) {
    return undefined;
  }

  return new model.SchemeNode<S>({
    id: helpers.stringId(obj.id),
    scheme: model.resolveAifScheme(obj.type, obj.text),
    // descriptors map roles to atom ids, the conclusion is not a premise
    premiseDescriptors: Object.entries(obj.descriptors).flatMap(([role, id]) =>
      id === null || role.toLowerCase().startsWith("s_conclusion") ? [] : [helpers.stringId(id)],
    ),
    metadata: metadataFromOva(obj),
    userdata: codecs.scheme.decode({}),
  });
}

function atomFromOva<S extends UserdataSchema>(
  obj: ovaSchema.Node,
  codecs: ResolvedCodecs<S>,
): model.AtomNode<S> {
  return new model.AtomNode<S>({
    id: helpers.stringId(obj.id),
    text: obj.text,
    metadata: metadataFromOva(obj),
    userdata: codecs.atom.decode({}),
  });
}
