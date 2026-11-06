import type { JsonObject, JsonValue } from "@bufbuild/protobuf";
import * as model from "#/model/index.js";
import { defaultScheme } from "#/model/scheme.js";
import * as schema from "#/schemas/argdown.js";
import type { UserdataSchema } from "#/model/userdata.js";
import * as helpers from "#/load/helpers.js";

// symmetric relations are added in both directions
const relations: Readonly<Record<schema.RelationType, [model.SchemeType, boolean]>> = {
  support: ["support", false],
  entails: ["support", false],
  attack: ["attack", false],
  undercut: ["attack", false],
  contrary: ["attack", true],
  contradictory: ["attack", true],
};

function argdownUserdata(fields: Readonly<Record<string, JsonValue | undefined>>): JsonObject {
  return { argdown: helpers.compact(fields) };
}

/** Text of the last defining member, preferring members marked as canonical (upstream rule). */
function canonicalText(members: readonly schema.MemberOutput[]): string | undefined {
  const definitions = members.filter((member) => !member.isReference);
  const canonical =
    definitions.findLast((member) => member.data?.isCanonical) ?? definitions.at(-1);

  return canonical?.text?.trim();
}

function isConclusion(statement: schema.StatementOutput): boolean {
  return (
    statement.inference !== undefined &&
    (statement.role === "intermediary-conclusion" || statement.role === "main-conclusion")
  );
}

/** Premises of the conclusion at `index`, its `uses` or all statements back to the previous conclusion. */
function premises(argument: schema.ArgumentOutput, index: number): schema.StatementOutput[] {
  const { pcs } = argument;
  const conclusion = pcs[index];
  const uses = conclusion.inference?.data?.uses ?? conclusion.data?.uses;

  if (uses === undefined || uses === null) {
    let start = index - 1;

    while (start > 0 && !isConclusion(pcs[start])) {
      start--;
    }

    return pcs.slice(Math.max(start, 0), index);
  }

  if (
    !Array.isArray(uses) ||
    !uses.every(
      (n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= index,
    )
  ) {
    throw new Error(
      `Invalid 'uses' ${JSON.stringify(uses)} of statement ${index + 1} in argument '${argument.title}'.`,
    );
  }

  return uses.map((n) => pcs[n - 1]);
}

/**
 * Load a graph from the Argdown JSON export, use `arguebuf/argdown` for Argdown source text.
 * Throws an `invalid-input` error for structurally invalid input.
 */
export function argdown<S extends UserdataSchema = {}>(
  obj: schema.Graph,
  ...args: helpers.LoadArgs<S>
): model.Graph<S> {
  const ctx = helpers.loadOptions<S>(...args);
  const { name, codecs } = ctx;
  const input = helpers.parseInput("Argdown", schema.Graph, obj);
  const graph = new model.GraphDraft<S>({
    name,
    userdata: codecs.graph.decode(input.frontMatter),
  });
  // inference schemes by argument title and conclusion index
  const inferences = new Map<string, Map<number, model.SchemeNodeOf<S>>>();

  const link = (source: model.Node<S>, target: model.Node<S>) => {
    graph.addEdge(
      new model.Edge({ source: source.id, target: target.id, userdata: codecs.edge.decode({}) }),
    );
  };

  const addAtom = (
    element: schema.EquivalenceClassOutput | schema.ArgumentOutput,
    fields: Readonly<Record<string, JsonValue>> = {},
  ) => {
    const node = new model.AtomNode({
      text: canonicalText(element.members) || element.title,
      userdata: codecs.atom.decode(
        argdownUserdata({
          title: element.title,
          tags: element.tags,
          data: element.data,
          ...fields,
        }),
      ),
    });
    graph.addNode(node);

    return node;
  };

  const statements = Object.fromEntries(
    Object.entries(input.statements).map(([title, ec]) => [title, addAtom(ec)]),
  );

  const addInferences = (title: string, argument: schema.ArgumentOutput) => {
    let main: model.SchemeNodeOf<S> | undefined;
    const owner = `argument '${title}'`;
    const conclusions = new Map<number, model.SchemeNodeOf<S>>();
    inferences.set(title, conclusions);

    for (const [index, statement] of argument.pcs.entries()) {
      if (!isConclusion(statement)) {
        continue;
      }

      const scheme = new model.SchemeNode({
        scheme: defaultScheme("support"),
        userdata: codecs.scheme.decode(
          argdownUserdata({
            title,
            description: canonicalText(argument.members),
            inferenceRules: statement.inference?.inferenceRules,
            data: statement.inference?.data,
          }),
        ),
      });
      graph.addNode(scheme);

      for (const premise of premises(argument, index)) {
        const node = helpers.lookup(ctx, statements, premise.title, "equivalence-class", owner);

        if (node !== undefined) {
          link(node, scheme);
        }
      }

      const conclusion = helpers.lookup(
        ctx,
        statements,
        statement.title,
        "equivalence-class",
        owner,
      );

      if (conclusion !== undefined) {
        link(scheme, conclusion);
      }

      conclusions.set(index, scheme);
      main = scheme;
    }

    return main;
  };

  // Reconstructed arguments are represented by their main inference
  const argumentNodes = Object.fromEntries(
    Object.entries(input.arguments).map(([title, argument]) => [
      title,
      addInferences(title, argument) ?? addAtom(argument, { argument: true }),
    ]),
  );

  const members: Readonly<Record<string, Readonly<Record<string, model.Node<S>>>>> = {
    "equivalence-class": statements,
    argument: argumentNodes,
  };

  const member = (
    title: string,
    type: string,
    index: number | undefined,
    owner: string,
  ): model.Node<S> | undefined => {
    if (type !== "inference") {
      const group = helpers.lookup(ctx, members, type, "member type", owner);

      return group && helpers.lookup(ctx, group, title, type, owner);
    }

    const node = index === undefined ? undefined : inferences.get(title)?.get(index);

    if (node === undefined) {
      ctx.report(
        "unknown-element",
        `Skipping unknown inference ${index} of argument '${title}' referenced by ${owner}.`,
      );
    }

    return node;
  };

  for (const relation of input.relations) {
    const owner = `${relation.relationType} relation`;
    const mapping = helpers.lookup(ctx, relations, relation.relationType, "relation type", owner);

    if (mapping === undefined) {
      continue;
    }

    const [type, symmetric] = mapping;
    const source = member(relation.from, relation.fromType, undefined, owner);
    const target = member(relation.to, relation.toType, relation.conclusionIndex, owner);

    if (source === undefined || target === undefined) {
      continue;
    }

    const directions: [model.Node<S>, model.Node<S>][] = [[source, target]];

    if (symmetric) {
      directions.push([target, source]);
    }

    for (const [start, end] of directions) {
      const node = new model.SchemeNode({
        scheme: defaultScheme(type),
        userdata: codecs.scheme.decode(argdownUserdata({ relationType: relation.relationType })),
      });
      graph.addNode(node);
      helpers.connect(graph, ctx, [start.id], node.id, end.id);
    }
  }

  return graph.freeze();
}
