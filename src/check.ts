import { type Issue, type IssueCode, issue, unresolvedReference } from "#/issue.js";
import { isAnchored } from "#/locate.js";
import type { GraphView } from "#/model/graph.js";
import type { Node } from "#/model/node.js";
import type { UserdataSchema } from "#/model/userdata.js";
import { dfs } from "#/traverse.js";

export interface CheckOptions {
  /** Codes of issues that are not reported. */
  readonly ignore?: Iterable<IssueCode>;
}

/**
 * Find the problems of a graph that the strict model cannot prevent,
 * i.e. untyped schemes, references that do not match their resource, and quality problems of the argument.
 */
export function check<S extends UserdataSchema>(
  graph: GraphView<S>,
  options: CheckOptions = {},
): Issue[] {
  const nodes = Object.values(graph.nodes);
  const atoms = nodes.filter((node) => node.type === "atom");
  const linked = nodes.filter(
    (node) => graph.incomingEdges(node).length + graph.outgoingEdges(node).length > 0,
  );
  const connected = new Set(linked.map((node) => node.id));
  const issues: Issue[] = [];

  for (const node of nodes) {
    if (node.type === "scheme") {
      const conclusions = graph.outgoingEdges(node).length;

      if (node.scheme.case === undefined) {
        issues.push(issue("untyped-scheme", `Scheme '${node.id}' has no type.`, [node.id]));
      }

      if (graph.premiseNodes(node).length === 0) {
        issues.push(
          issue("scheme-without-premise", `Scheme '${node.id}' has no premise.`, [node.id]),
        );
      }

      if (conclusions === 0) {
        issues.push(
          issue("scheme-without-conclusion", `Scheme '${node.id}' has no conclusion.`, [node.id]),
        );
      } else if (conclusions > 1) {
        issues.push(
          issue(
            "scheme-multiple-conclusions",
            `Scheme '${node.id}' has ${conclusions} conclusions.`,
            [node.id],
          ),
        );
      }

      continue;
    }

    const { reference } = node;

    if (reference?.resource !== undefined) {
      const { resource, text, offset } = reference;
      const source = graph.resources[resource].text;

      if (offset === undefined) {
        if (!source.includes(text)) {
          issues.push(unresolvedReference(node.id, resource));
        }
      } else if (!isAnchored(source, text, offset)) {
        issues.push(
          issue(
            "reference-mismatch",
            `The reference of atom '${node.id}' does not match resource '${resource}' at offset ${reference.offset}.`,
            [node.id, resource],
          ),
        );
      }
    }
  }

  for (const atom of atoms) {
    if (!connected.has(atom.id)) {
      issues.push(issue("orphaned-atom", `Atom '${atom.id}' has no relations.`, [atom.id]));
    }
  }

  const components: Node<S>[][] = [];
  const visited = new Set<string>();

  for (const node of linked) {
    if (!visited.has(node.id)) {
      const component = dfs(node, (member) => graph.neighborNodes(member));
      component.forEach((member) => visited.add(member.id));
      components.push(component);
    }
  }

  if (components.length > 1) {
    issues.push(
      issue(
        "disconnected",
        `The graph splits into ${components.length} disconnected parts.`,
        components.map((component) => component[0].id),
      ),
    );
  }

  const { majorClaim } = graph;

  if (majorClaim === undefined) {
    if (atoms.length > 0) {
      issues.push(issue("no-major-claim", "No major claim is set."));
    }
  } else {
    const ancestors = new Set(
      dfs(graph.nodes[majorClaim], (node) => graph.incomingNodes(node)).map((node) => node.id),
    );

    for (const atom of atoms) {
      if (connected.has(atom.id) && !ancestors.has(atom.id)) {
        issues.push(
          issue(
            "unreachable-major-claim",
            `Atom '${atom.id}' is not connected to the major claim '${majorClaim}'.`,
            [atom.id, majorClaim],
          ),
        );
      }
    }
  }

  const ignored = new Set(options.ignore);

  return issues.filter((item) => !ignored.has(item.code));
}
