import * as model from "#/model/index.js";
import { defaultScheme } from "#/model/scheme.js";
import type { UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";

// Example: 1.1. Pro: Gold is better than silver.
// Pattern: {ID}.{ID}. {STANCE (OPTIONAL)}: {TEXT}
const STATEMENT = /^(1\.(?:\d+\.)*) (?:(Con|Pro): )?(.*)/s;
const REFERENCE = /^-> See ((?:\d+\.)+)/;

const stance2scheme: Readonly<Record<string, model.SchemeType>> = {
  Pro: "support",
  Con: "attack",
  "": "rephrase",
};

interface Statement {
  stance: string;
  text: string;
}

/**
 * Load a graph from a kialo discussion export.
 *
 * The discussion title becomes the name of the graph (instead of `options.name`)
 * and the first statement its major claim.
 * Statements use their kialo id (e.g. `1.2.`) as atom id and span all lines until the next statement.
 * A statement `-> See 1.3.` refers to the atom of another statement,
 * so it and its children are attached to that atom.
 */
export function kialo<S extends UserdataSchema = {}>(
  input: string,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const ctx = helpers.loadOptions<S>(...args);
  const { codecs, ...options } = ctx;
  const [title = "", separator = "", ...lines] = helpers.lines(input);

  if (separator.trim()) {
    throw new Error("The title is not followed by an empty line!");
  }

  const statements = new Map<string, Statement>();
  let current: Statement | undefined;

  for (const line of lines) {
    const match = STATEMENT.exec(line);

    // only the major claim has the id `1.`, all others are nested below it
    if (statements.size === 0) {
      if (match?.[1] !== "1.") {
        throw new Error("The major claim is not present in the third line!");
      }

      current = { stance: "", text: match[3] };
      statements.set(match[1], current);
    } else if (match !== null && match[1] !== "1.") {
      if (statements.has(match[1])) {
        throw new Error(`The statement '${match[1]}' is not unique!`);
      }

      current = { stance: match[2] ?? "", text: match[3] };
      statements.set(match[1], current);
    } else if (current !== undefined) {
      current.text = `${current.text}\n${line.trim()}`;
    }
  }

  if (statements.size === 0) {
    throw new Error("The major claim is not present in the third line!");
  }

  const name = /Discussion Title: (.*)/s.exec(title)?.[1].trim() ?? options.name;
  const graph = new model.Graph<S>({ name, userdata: codecs.graph.decode({}) });
  const references = new Map<string, string>();

  for (const [id, statement] of statements) {
    statement.text = statement.text.trim();
    const reference = REFERENCE.exec(statement.text);

    if (reference === null) {
      graph.addNode(
        new model.AtomNode({
          id,
          text: kialoText(statement.text),
          userdata: codecs.atom.decode({}),
        }),
      );
    } else {
      references.set(id, reference[1]);
    }
  }

  const atoms = graph.atomNodes;
  const resolve = (id: string, owner: string): model.AtomNodeOf<S> | undefined => {
    const visited = new Set<string>();

    while (references.has(id) && !visited.has(id)) {
      visited.add(id);
      id = references.get(id) ?? id;
    }

    return helpers.lookup(ctx, atoms, id, "statement", owner);
  };

  graph.majorClaim = resolve("1.", "the major claim");

  for (const [id, statement] of statements.entries().drop(1)) {
    const parentId = id.slice(0, id.lastIndexOf(".", id.length - 2) + 1);
    const owner = `statement '${id}'`;
    const source = resolve(id, owner);
    const target = source && resolve(parentId, owner);

    if (source !== undefined && target !== undefined) {
      const scheme = new model.SchemeNode({
        id: `${id}scheme`,
        scheme: defaultScheme(stance2scheme[statement.stance]),
        userdata: codecs.scheme.decode({}),
      });
      graph.addNode(scheme);
      helpers.connect(graph, ctx, [source.id], scheme.id, target.id);
    }
  }

  return graph;
}

/**
 * Remove markdown links (their targets may contain balanced parentheses)
 * and the escapes of parentheses and brackets.
 */
function kialoText(text: string): string {
  return text
    .replaceAll(/\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, "$1")
    .replaceAll(/\\([[\]()])/g, "$1");
}
