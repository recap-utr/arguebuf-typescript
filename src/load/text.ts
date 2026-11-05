import * as model from "#/model/index.js";
import type { UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";
import { kialo } from "#/load/kialo.js";

/** Load a kialo export, or a plain text as a graph containing a single atom node. */
export function text<S extends UserdataSchema = {}>(
  input: string,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const [title = ""] = helpers.lines(input);

  if (helpers.KIALO_TITLE.test(title)) {
    return kialo<S>(input, ...args);
  }

  const { name, codecs } = helpers.loadOptions<S>(...args);

  return new model.Graph<S>({
    name,
    nodes: [new model.AtomNode({ text: input, userdata: codecs.atom.decode({}) })],
    userdata: codecs.graph.decode({}),
  });
}
