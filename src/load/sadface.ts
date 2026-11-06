import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { defaultScheme, normalizeSchemeLabel } from "#/model/scheme.js";
import * as sadfaceSchema from "#/schemas/sadface.js";
import type { ResolvedCodecs, UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";

// names of generic `scheme` nodes that denote a scheme type instead of a specific scheme
const name2schemeType: ReadonlyMap<string, model.SchemeType> = new Map([
  ["support", "support"],
  ["inference", "support"],
  ["attack", "attack"],
  ["conflict", "attack"],
  ["rephrase", "rephrase"],
  ["preference", "preference"],
]);

/**
 * Load a graph from the SADFace format
 * (https://github.com/Open-Argumentation/SADFace/blob/master/examples/hangback/data.json).
 *
 * The first source of an atom becomes its reference.
 * Nodes of unknown types are skipped with a warning.
 * Without a creation date, the edit date is used for both.
 * Throws an `invalid-input` error for structurally invalid input.
 */
export function sadface<S extends UserdataSchema = {}>(
  obj: sadfaceSchema.Graph,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const ctx = helpers.loadOptions<S>(...args);
  const { name, codecs } = ctx;
  const input = helpers.parseInput("SADFace", sadfaceSchema.Graph, obj);
  const { core } = input.metadata;
  const updated = date.parseIso(core.edited);
  const graph = new model.GraphDraft<S>({
    name,
    metadata: new model.Metadata({ created: date.parseIso(core.created) ?? updated, updated }),
    userdata: codecs.graph.decode(
      helpers.compact({
        notes: core.notes,
        description: core.description,
        title: core.title,
        sadfaceVersion: core.version,
      }),
    ),
  });

  if (core.analyst_name || core.analyst_email) {
    graph.addAnalyst(
      new model.Analyst({
        name: core.analyst_name || undefined,
        email: core.analyst_email || undefined,
        userdata: codecs.analyst.decode({}),
      }),
    );
  }

  for (const resource of input.resources) {
    graph.addResource(
      new model.Resource({
        id: resource.id,
        text: resource.content || "",
        userdata: codecs.resource.decode(resource.metadata),
      }),
    );
  }

  for (const node of input.nodes) {
    switch (node.type) {
      case "atom":
        helpers.addNode(graph, ctx, atomFromSadface(node, graph.resources, ctx));
        break;
      case "scheme":
      case "inference":
      case "conflict":
        helpers.addNode(graph, ctx, schemeFromSadface(node, codecs));
        break;
      default:
        ctx.report(
          "unknown-element",
          `Skipping node '${node.id}' of unknown type '${node.type}'.`,
          [node.id],
        );
    }
  }

  for (const edge of input.edges) {
    helpers.addEdge(graph, ctx, { id: edge.id, source: edge.source_id, target: edge.target_id });
  }

  helpers.relocate(graph, ctx);

  return graph.freeze();
}

function atomFromSadface<S extends UserdataSchema>(
  obj: sadfaceSchema.NodeOutput,
  resources: Readonly<Record<string, model.ResourceOf<S>>>,
  ctx: helpers.Context<S>,
): model.AtomNodeOf<S> {
  const [source] = obj.sources;
  const owner = `atom node '${obj.id}'`;

  return new model.AtomNode({
    id: obj.id,
    text: obj.text ?? "",
    reference:
      source &&
      helpers.newReference(ctx, source.text, source.resource_id, source.offset, resources, owner),
    userdata: ctx.codecs.atom.decode(obj.metadata),
  });
}

/**
 * `inference` nodes are resolved by their name, `conflict` nodes are attacks.
 * Generic `scheme` nodes are resolved via `name2schemeType` or as inference names,
 * a missing name yields no scheme.
 */
function schemeFromSadface<S extends UserdataSchema>(
  obj: sadfaceSchema.NodeOutput,
  codecs: ResolvedCodecs<S>,
): model.SchemeNodeOf<S> {
  const name = obj.name || "";
  const type = name2schemeType.get(normalizeSchemeLabel(name));
  let scheme: model.Scheme;

  if (obj.type === "inference") {
    scheme = model.resolveScheme("support", name);
  } else if (obj.type === "conflict") {
    scheme = defaultScheme("attack");
  } else if (type !== undefined) {
    scheme = defaultScheme(type);
  } else {
    scheme = name ? model.resolveScheme("support", name) : { case: undefined };
  }

  return new model.SchemeNode({
    id: obj.id,
    scheme,
    userdata: codecs.scheme.decode(obj.metadata),
  });
}
