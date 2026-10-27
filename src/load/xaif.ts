import * as model from "../model/index.js";
import type * as xaifSchema from "../schemas/xaif.js";
import { aif } from "./aif.js";
import type { UserdataSchema } from "../model/userdata.js";
import * as helpers from "./helpers.js";
import { parseHtml } from "./html.js";

/**
 * Load a graph from the xAIF format.
 *
 * The `AIF` object is loaded like AIF.
 * The `text` (a string or `{txt: ...}`) is HTML whose plain text (see `parseHtml`)
 * becomes a resource if it is not empty, a missing text is skipped.
 */
export function xaif<S extends UserdataSchema = {}>(
  obj: xaifSchema.Graph,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): model.Graph<S> {
  const { codecs } = helpers.loadOptions<S>(...args);
  const graph = aif<S>(obj.AIF, ...args);
  const html = typeof obj.text === "string" ? obj.text : obj.text?.txt;
  const [text] = parseHtml(html ?? "");

  if (text) {
    graph.addResource(new model.Resource<S>({ text, userdata: codecs.resource.decode({}) }));
  }

  return graph;
}
