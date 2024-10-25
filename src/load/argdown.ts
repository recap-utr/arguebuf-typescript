import {
  ArgdownApplication,
  IArgdownRequest,
  IMap,
  IMapEdge,
  IMapNode,
  MapPlugin,
  ModelPlugin,
  ParserPlugin,
  PreselectionPlugin,
} from "@argdown/core";
import * as model from "../model/index.js";

export function argdown(obj: string) {
  const app = new ArgdownApplication();

  const parserPlugin = new ParserPlugin();
  app.addPlugin(parserPlugin, "parse-input");

  const modelPlugin = new ModelPlugin();
  app.addPlugin(modelPlugin, "build-model");

  const preselectionPlugin = new PreselectionPlugin();
  app.addPlugin(preselectionPlugin, "preselection-plugin");

  const mapPlugin = new MapPlugin();
  app.addPlugin(mapPlugin, "map-plugin");

  const request: IArgdownRequest = {
    input: obj,
    process: [
      "parse-input",
      "build-model",
      "preselection-plugin",
      "map-plugin",
    ],
    logLevel: "verbose",
  };
  const response = app.run(request);

  if (response.map !== undefined) {
    const map: IMap = response.map;
    // Create and add the atom nodes
    const nodes: Record<string, model.Node> = Object.fromEntries(
      map.nodes
        .filter((value) => inEdges(value, map.edges))
        .map((n) => {
          const argdownNode = nodefromArgdown(n);
          return [argdownNode.id, argdownNode];
        }),
    );

    const edges: Record<string, model.Edge> = {};
    map.edges.forEach((e) => {
      // Create new scheme node and add it
      const schemeNode = schemeNodeFromEdge(e);
      nodes[schemeNode.id] = schemeNode;

      // Create the two edges to and from the schemeNode
      const e1 = new model.Edge({
        source: e.from.id,
        target: schemeNode.id,
        metadata: new model.Metadata(),
      });
      edges[e1.id] = e1;
      const e2 = new model.Edge({
        source: schemeNode.id,
        target: e.to.id,
        metadata: new model.Metadata(),
      });
      edges[e2.id] = e2;
    });

    return new model.Graph({
      metadata: new model.Metadata(),
      nodes: nodes,
      edges: edges,
    });
  } else {
    // Empty graph
    return new model.Graph({
      metadata: new model.Metadata(),
    });
  }
}

function nodefromArgdown(obj: IMapNode): model.Node {
  return new model.AtomNode({
    text: obj.labelText === undefined ? "" : obj.labelText,
    metadata: new model.Metadata(),
  });
}

function inEdges(node: IMapNode, edges: IMapEdge[]): boolean {
  return (
    edges.find(
      (value) => value.from.id === node.id || value.to.id === node.id,
    ) !== undefined
  );
}

function schemeNodeFromEdge(obj: IMapEdge): model.SchemeNode {
  let scheme: model.Scheme | undefined = undefined;
  if (obj.relationType === "attack") {
    scheme = {
      value: model.Attack.DEFAULT,
      case: "attack",
    };
  } else if (obj.relationType == "support") {
    scheme = {
      value: model.Support.DEFAULT,
      case: "support",
    };
  } else if (obj.relationType == "contradictory") {
    scheme = {
      value: model.Attack.DEFAULT,
      case: "attack",
    };
  } else if (obj.relationType == "undercut") {
    scheme = {
      value: model.Attack.DEFAULT,
      case: "attack",
    };
  }
  return new model.SchemeNode({
    scheme: scheme,
    metadata: new model.Metadata(),
  });
}
