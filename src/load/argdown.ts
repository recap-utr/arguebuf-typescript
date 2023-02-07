import * as date from "../date.js";
import * as model from "../model/index.js";
import * as argdownSchema from "../schemas/argdown.js";
import {
  ArgdownApplication,
  IArgdownRequest,
  ParserPlugin,
  ModelPlugin,
  PreselectionPlugin,
  MapPlugin,
  IMapNode,
  IMapEdge,
} from "@argdown/core";

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

  // Create and add the atom nodes
  var nodes: { [key: string]: model.Node } = Object.fromEntries(
    response
      .map!.nodes.filter((value) => inEdges(value, response.map!.edges))
      .map((n) => {
        const argdownNode = nodefromArgdown(n);
        return [argdownNode.id, argdownNode];
      })
  );

  var edges: { [key: string]: model.Edge } = {};
  response.map!.edges.forEach((e) => {
    // Create new scheme node and add it
    const schemeNode = schemeNodeFromEdge(e);
    nodes[schemeNode.id] = schemeNode;
    // Create the two edges to and from the schemeNode
    const e1 = new model.Edge({
      source: nodes[e.from.id],
      target: schemeNode,
      metadata: new model.Metadata(),
    });
    edges[e1.id] = e1;
    const e2 = new model.Edge({
      source: schemeNode,
      target: nodes[e.to.id],
      metadata: new model.Metadata(),
    });
    edges[e2.id] = e2;
  });

  return new model.Graph({
    metadata: new model.Metadata(),
    nodes: nodes,
    edges: edges,
  });
}

function nodefromArgdown(obj: IMapNode): model.Node {
  return new model.AtomNode({
    text: obj.labelText === undefined ? "" : obj.labelText,
    metadata: new model.Metadata(),
  });
}

function inEdges(node: IMapNode, edges: Array<IMapEdge>): boolean {
  return (
    edges.find(
      (value) => value.from.id === node.id || value.to.id === node.id
    ) !== undefined
  );
}

function schemeNodeFromEdge(obj: IMapEdge): model.SchemeNode {
  var scheme: any = undefined;
  /*
    ################ todo: other cases
    */
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
  }
  return new model.SchemeNode({
    scheme: scheme,
    metadata: new model.Metadata(),
  });
}
