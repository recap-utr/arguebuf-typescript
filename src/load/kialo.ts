import * as model from "../model/index.js";

export function kialo(input: string): model.Graph {
  var nodes: model.Node[] = [];
  var edges: model.Edge[] = [];

  const iter: IterableIterator<string> = input.split("\n").values();

  // Get the discussion title (if available)
  const title_search = iter.next().value.match(/Discussion Title: (.*)/);
  if (title_search !== null) {
    // if there is a match
    // Do something with the discussion title
  }

  // After the title, an empty line should follow
  if (iter.next().value.trim() !== "") {
    throw new Error("No empty-line after discussion title!");
  }

  // Example: 1.1. Pro: Gold is better than silver.
  // Pattern: {ID}.{ID}. {STANCE (OPTIONAL)}: {TEXT}
  const pattern: RegExp = /^(1\.(?:\d+\.)+) (?:(Con|Pro): )?(.*)/;
  var current_line: string = iter.next().value;
  var next_line: string = iter.next().value;

  const mc_match = current_line.match(/^((?:\d+\.)+) (.*)/);
  if (mc_match === null) {
    throw new Error("The major claim is not present in the third line!");
  }
  const mc_id = mc_match[1];
  var mc_text = mc_match[2];

  // See in the following while loop for explanation of this block
  while (next_line !== undefined && next_line.match(pattern) === null) {
    mc_text += "\n" + next_line.trim();
    next_line = iter.next().value;
  }

  const mc: model.AtomNode = nodeFromKialo(mc_id, mc_text);
  nodes.push(mc);

  current_line = next_line;
  next_line = iter.next().value;

  while (current_line !== undefined) {
    const current_match = current_line.match(pattern);
    if (current_match !== null) {
      const source_id: string = current_match[1];
      const source_id_parts: string[] = source_id.slice(0, -1).split(".");
      var stance: string = current_match[2];
      var text: string = current_match[3];

      /*
            The text of a node is allowed to span multiple lines.
            Thus, we need to look ahead to concatenate the complete text.
            As long as the pattern is not found in the next line,
            we assume that the text belongs to the previous statement.
            */
      while (next_line !== undefined && next_line.match(pattern) === null) {
        text += "\n" + next_line.trim();
        next_line = iter.next().value;
      }

      if (source_id === undefined) {
        throw new Error("source_id should not be undefined!");
      }
      if (text === undefined) {
        throw new Error("text should not be undefined!");
      }

      var source;
      const id_ref_match = text.match(/^-> See ((?:\d+\.)+)/);
      if (id_ref_match !== null) {
        const id_ref = id_ref_match[1];
        source = nodes.find((n) => n.id === id_ref)!;
      } else {
        source = nodeFromKialo(source_id, text);
        nodes.push(source);
      }

      var scheme: model.SchemeNode;
      if (stance !== undefined) {
        stance = stance.toLowerCase();
        scheme = new model.SchemeNode({
          id: source_id + "scheme",
          scheme:
            stance === "con"
              ? {
                  value: model.Attack.DEFAULT,
                  case: "attack",
                }
              : {
                  value: model.Support.DEFAULT,
                  case: "support",
                },
        });
      } else {
        scheme = new model.SchemeNode({
          id: source_id + "scheme",
          scheme: {
            value: model.Rephrase.DEFAULT,
            case: "rephrase",
          },
        });
      }

      const target_id = source_id_parts.slice(0, -1).join(".") + ".";
      const target = nodes.find((n) => n.id === target_id)!;

      nodes.push(scheme);
      edges.push(
        new model.Edge({
          source: source,
          target: scheme,
          id: source.id + "->" + scheme.id,
        })
      );
      edges.push(
        new model.Edge({
          source: scheme,
          target: target,
          id: scheme.id + "->" + target.id,
        })
      );

      current_line = next_line;
      next_line = iter.next().value;
    }
  }

  return new model.Graph({
    majorClaim: mc.text,
    nodes: nodes,
    edges: edges,
  });
}

function nodeFromKialo(id: string, text: string): model.AtomNode {
  // Remove backslashes before parentheses/brackets
  text = text.replaceAll(/\\([\[\]\(\)])/g, "$1");

  // Remove markdown links
  text = text.replaceAll(/\[(.*?)\]\(.*?\)/g, "$1");

  return new model.AtomNode({
    id: id,
    text: text,
  });
}
