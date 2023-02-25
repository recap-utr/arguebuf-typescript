import * as date from "../date.js";
import * as model from "../model/index.js";
import * as sadfaceSchema from "../schemas/sadface.js";

export function edgeFromSadface(obj: sadfaceSchema.Edge): model.Edge {
  return new model.Edge({
    id: obj.id,
    source: obj.source_id,
    target: obj.target_id,
    metadata: new model.Metadata(),
  });
}

function nodeFromSadface(obj: sadfaceSchema.Node): model.Node {
  if (obj.type === "atom") {
    return new model.AtomNode({
      id: obj.id,
      text: obj.text,
      userdata: obj.metadata,
    });
  } else {
    const node = new model.SchemeNode({
      id: obj.id,
      userdata: obj.metadata,
    });

    if (obj.name === "conflict" || obj.name === "attack") {
      node.scheme.value = model.Attack.DEFAULT;
      node.scheme.case = "attack";
    } else if (obj.name === "support") {
      node.scheme.value = model.Support.DEFAULT;
      node.scheme.case = "support";
    } else if (obj.name === "rephrase") {
      node.scheme.value = model.Rephrase.DEFAULT;
      node.scheme.case = "rephrase";
    } else if (obj.name === "preference") {
      node.scheme.value = model.Preference.DEFAULT;
      node.scheme.case = "preference";
    }

    return node;
  }
}

export function sadface(obj: sadfaceSchema.Graph): model.Graph {
  const nodes = Object.fromEntries(
    obj.nodes.map((node) => [node.id, nodeFromSadface(node)])
  );
  const edges = Object.fromEntries(
    obj.edges.map((edge) => [edge.id, edgeFromSadface(edge)])
  );

  const metadata = new model.Metadata({
    created:
      obj.metadata.core.created !== undefined
        ? date.parse(obj.metadata.core.created, sadfaceSchema.DATE_FORMAT)
        : undefined,
    updated:
      obj.metadata.core.edited !== undefined
        ? date.parse(obj.metadata.core.edited, sadfaceSchema.DATE_FORMAT)
        : undefined,
  });
  const analystId: string = model.uuid();
  const analysts: { [key: string]: model.Analyst } = {};
  analysts[analystId] = new model.Analyst({
    name: obj.metadata.core.analyst_name,
    email: obj.metadata.core.analyst_email,
  });

  const userdata = {
    notes: obj.metadata.core.notes === undefined ? "" : obj.metadata.core.notes,
    description:
      obj.metadata.core.description === undefined
        ? ""
        : obj.metadata.core.description,
    title: obj.metadata.core.title === undefined ? "" : obj.metadata.core.title,
    version:
      obj.metadata.core.version === undefined ? "" : obj.metadata.core.version,
  };

  return new model.Graph({
    nodes,
    edges,
    userdata,
    analysts: analysts,
    metadata,
  });
}
