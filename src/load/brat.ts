import * as model from "../model/index.js";
import { defaultScheme } from "../model/scheme.js";
import type { UserdataSchema } from "../model/userdata.js";
import * as helpers from "./helpers.js";

const relation2scheme: Readonly<Record<string, model.SchemeType>> = {
  supports: "support",
  attacks: "attack",
};
const stance2scheme: Readonly<Record<string, model.SchemeType>> = {
  For: "support",
  Against: "attack",
};

/**
 * Load a graph from the brat standoff format (https://brat.nlplab.org/).
 *
 * Lines consist of tab-separated columns, blank lines are skipped.
 * Text-bound annotations (`T1 Claim 0 10 text`) become atoms with the brat id.
 * The first `MajorClaim` is the major claim, further ones rephrase it.
 * Stances (`A1 Stance T2 For|Against`) support or attack the major claim,
 * relations (`R1 supports|attacks Arg1:T3 Arg2:T2`) connect their arguments by role.
 * Scheme nodes use the id of their annotation (`<T id>scheme` for rephrases).
 * Unknown stances, relation types, and atoms are skipped with a warning,
 * lines of other shapes are ignored.
 */
export function brat<S extends UserdataSchema = {}>(
  input: string,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const { name, codecs } = helpers.loadOptions<S>(...args);
  const graph = new model.Graph<S>({ name, userdata: codecs.graph.decode({}) });
  const rows = helpers
    .lines(input)
    .filter((line) => line.trim())
    .map((line) => line.split("\t"));

  for (const [id, annotation, text] of rows) {
    if (!id.startsWith("T") || annotation === undefined || text === undefined) {
      continue;
    }

    const atom = new model.AtomNode<S>({ id, text, userdata: codecs.atom.decode({}) });
    graph.addNode(atom);

    if (annotation.trim().split(/\s+/)[0] !== "MajorClaim") {
      continue;
    }

    if (graph.majorClaim === undefined) {
      graph.majorClaim = atom;
    } else {
      graph.addNode(
        new model.SchemeNode<S>({
          id: `${id}scheme`,
          scheme: defaultScheme("rephrase"),
          userdata: codecs.scheme.decode({}),
        }),
      );
      helpers.connect(graph, codecs, [id], `${id}scheme`, graph.majorClaim);
    }
  }

  const atoms = graph.atomNodes;

  for (const [id, annotation = ""] of rows) {
    const owner = `annotation '${id}'`;
    const [kind, ...args] = annotation.trim().split(/\s+/);
    let type: model.SchemeType | undefined;
    let source: string | undefined;
    let target: string | undefined;

    if (id.startsWith("A") && kind === "Stance" && args.length === 2) {
      const [sourceId, stance] = args;
      type = helpers.lookup(stance2scheme, stance, "stance", owner);
      source = helpers.lookup(atoms, sourceId, "atom", owner)?.id;
      target = graph.majorClaim;

      if (target === undefined) {
        helpers.warn(`Skipping stance '${id}' without a major claim.`);
      }
    } else if (id.startsWith("R")) {
      // arguments are given by role, e.g. `Arg1:T3`
      const roles = new Map(
        args
          .filter((arg) => arg.includes(":"))
          .map((arg) => {
            const index = arg.indexOf(":");

            return [arg.slice(0, index), arg.slice(index + 1)] as const;
          }),
      );
      const sourceId = roles.get("Arg1");
      const targetId = roles.get("Arg2");

      if (sourceId === undefined || targetId === undefined) {
        continue;
      }

      type = helpers.lookup(relation2scheme, kind, "relation type", owner);
      source = helpers.lookup(atoms, sourceId, "atom", owner)?.id;
      target = helpers.lookup(atoms, targetId, "atom", owner)?.id;
    }

    if (type !== undefined && source !== undefined && target !== undefined) {
      graph.addNode(
        new model.SchemeNode<S>({
          id,
          scheme: defaultScheme(type),
          userdata: codecs.scheme.decode({}),
        }),
      );
      helpers.connect(graph, codecs, [source], id, target);
    }
  }

  return graph;
}
