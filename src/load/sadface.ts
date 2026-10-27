import * as date from "#/date.js";
import * as model from "#/model/index.js";
import { defaultScheme, normalizeSchemeLabel } from "#/model/scheme.js";
import type * as sadfaceSchema from "#/schemas/sadface.js";
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
 */
export function sadface<S extends UserdataSchema = {}>(
  obj: sadfaceSchema.Graph,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const { name, codecs } = helpers.loadOptions<S>(...args);
  const { core } = obj.metadata;
  const updated = date.parseIso(core.edited);
  const graph = new model.Graph<S>({
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
      new model.Analyst<S>({
        name: core.analyst_name || undefined,
        email: core.analyst_email || undefined,
        userdata: codecs.analyst.decode({}),
      }),
    );
  }

  for (const resource of obj.resources ?? []) {
    graph.addResource(
      new model.Resource<S>({
        id: resource.id,
        text: resource.content || "",
        userdata: codecs.resource.decode(resource.metadata ?? {}),
      }),
    );
  }

  for (const node of obj.nodes) {
    switch (node.type) {
      case "atom":
        graph.addNode(atomFromSadface(node, graph.resources, codecs));
        break;
      case "scheme":
      case "inference":
      case "conflict":
        graph.addNode(schemeFromSadface(node, codecs));
        break;
      default:
        helpers.warn(`Skipping node '${node.id}' of unknown type '${String(node.type)}'.`);
    }
  }

  for (const edge of obj.edges) {
    helpers.addEdge(graph, codecs, { id: edge.id, source: edge.source_id, target: edge.target_id });
  }

  return graph;
}

function atomFromSadface<S extends UserdataSchema>(
  obj: sadfaceSchema.Node,
  resources: Readonly<Record<string, model.Resource<S>>>,
  codecs: ResolvedCodecs<S>,
): model.AtomNode<S> {
  const source = obj.sources?.[0];
  const owner = `atom node '${obj.id}'`;

  return new model.AtomNode<S>({
    id: obj.id,
    text: obj.text ?? "",
    reference:
      source &&
      helpers.newReference(source.text, source.resource_id, source.offset, resources, owner),
    userdata: codecs.atom.decode(obj.metadata ?? {}),
  });
}

/**
 * `inference` nodes are resolved by their name, `conflict` nodes are attacks.
 * Generic `scheme` nodes are resolved via `name2schemeType` or as inference names,
 * a missing name yields no scheme.
 */
function schemeFromSadface<S extends UserdataSchema>(
  obj: sadfaceSchema.Node,
  codecs: ResolvedCodecs<S>,
): model.SchemeNode<S> {
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

  return new model.SchemeNode<S>({
    id: obj.id,
    scheme,
    userdata: codecs.scheme.decode(obj.metadata ?? {}),
  });
}
