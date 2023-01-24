import { uuid } from "arg-services";
import * as model from "../model/index.js";
import * as sadface from "../schema/sadface.js";
import * as date from "../services/date.js";

export function edgeFromSadface(
  obj: sadface.Edge,
  nodes: { [key: string]: model.Node },
): model.Edge {
  return new model.Edge({
    id: obj.id,
    source: nodes[obj.source_id],
    target: nodes[obj.target_id],
    metadata: new model.Metadata(),
  });
}

export function edgeToSadface(e: model.Edge): sadface.Edge {
  return {
    id: e.id,
    source_id: e.source.id,
    target_id: e.target.id,
  };
}

export function nodeToSadface(n: model.Node): sadface.Node {
  if (n.type === "atom") {
    return {
      id: n.id,
      metadata: n.userdata,
      sources: [],
      text: n.text,
      type: "atom",
    };
  } else if (n.type === "scheme") {
    return {
      id: n.id,
      metadata: {},
      name: n.scheme.case === undefined ? "undefined" : n.scheme.case,
      type: "scheme",
    };
  }

  throw new Error("Node type not supported");
}

export function nodeFromSadface(obj: sadface.Node): model.Node {
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

export function toSadface(obj: model.Graph): sadface.Graph {
  return {
    nodes: Object.values(obj.nodes).map((node) => nodeToSadface(node)),
    edges: Object.values(obj.edges).map((edge) => edgeToSadface(edge)),
    metadata: {
      core: {
        analyst_email: obj.analysts[0]?.email,
        analyst_name: obj.analysts[0]?.name,
        created: obj.metadata?.created?.toString(),
        edited: obj.metadata?.updated?.toString(),
        description: "",
        id: "",
        notes: "",
        title: "",
        version: "",
      },
    },
  };
}

export function fromSadface(obj: sadface.Graph): model.Graph {
  const nodes = Object.fromEntries(
    obj.nodes.map((node) => [node.id, nodeFromSadface(node)]),
  );
  const edges = Object.fromEntries(
    obj.edges.map((edge) => [edge.id, edgeFromSadface(edge, nodes)]),
  );

  const metadata = new model.Metadata({
    created:
      obj.metadata.core.created !== undefined
        ? date.parse(obj.metadata.core.created, sadface.DATE_FORMAT)
        : undefined,
    updated:
      obj.metadata.core.edited !== undefined
        ? date.parse(obj.metadata.core.edited, sadface.DATE_FORMAT)
        : undefined,
  });
  const analystId: string = uuid();
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
