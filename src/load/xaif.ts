import * as model from "#/model/index.js";
import * as xaifSchema from "#/schemas/xaif.js";
import { buildAif } from "#/load/aif.js";
import type { UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";
import { parseHtml } from "#/load/html.js";

/**
 * Load a graph from the xAIF format.
 *
 * The `AIF` object is loaded like AIF.
 * The `text` (a string or `{txt: ...}`) is HTML whose plain text (see `parseHtml`)
 * becomes a resource if it is not empty, a missing text is skipped.
 * Throws an `invalid-input` error for structurally invalid input.
 */
export function xaif<S extends UserdataSchema = {}>(
  obj: xaifSchema.Graph,
  ...args: helpers.LoadArgs<S, helpers.AifOptions>
): model.Graph<S> {
  const { codecs } = helpers.loadOptions<S>(...args);
  const input = helpers.parseInput("xAIF", xaifSchema.Graph, obj);
  const graph = buildAif<S>(input.AIF, ...args);
  const html = typeof input.text === "string" ? input.text : input.text?.txt;
  const [text] = parseHtml(html ?? "");

  return text
    ? graph.edit((draft) =>
        draft.addResource(new model.Resource({ text, userdata: codecs.resource.decode({}) })),
      )
    : graph;
}
