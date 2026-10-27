import type * as model from "../model/index.js";
import type * as aifSchema from "../schemas/aif.js";
import type * as xaifSchema from "../schemas/xaif.js";
import type { UserdataSchema } from "../model/userdata.js";
import { edgeToAif, nodeToAif } from "./aif.js";

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/**
 * Export a graph to the xAIF format.
 *
 * xAIF nodes have no timestamps, so they are omitted.
 * The resources are joined into an HTML `text` with newlines as `<br>`.
 */
export function xaif<S extends UserdataSchema>(obj: model.Graph<S>): xaifSchema.Graph {
  return {
    AIF: {
      nodes: Object.values(obj.nodes).map((node) => nodeToAif(node, false)),
      edges: Object.values(obj.edges).map(edgeToAif),
      locutions: [],
      schemefulfillments: [],
      descriptorfulfillments: [],
      participants: Object.values(obj.participants).map(participantToAif),
    },
    text: Object.values(obj.resources)
      .map((resource) => escapeHtml(resource.text).replaceAll("\n", "<br>"))
      .join("<br>"),
    dialog: false,
  };
}

/** Export a participant, its name is split at the first space into first name and surname. */
function participantToAif(obj: Pick<model.Participant, "id" | "name">): aifSchema.Participant {
  const name = obj.name ?? "";
  const index = name.indexOf(" ");

  return {
    participantID: obj.id,
    firstname: index < 0 ? name : name.slice(0, index),
    surname: index < 0 ? "" : name.slice(index + 1),
  };
}
