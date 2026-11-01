import { type Issue, issue, unresolvedReference } from "#/issue.js";
import { isAnchored, locate, type ThresholdOptions } from "#/locate.js";
import type { GraphDraft } from "#/model/graph.js";
import { Reference } from "#/model/reference.js";
import type { UserdataSchema } from "#/model/userdata.js";

/** Options of `GraphDraft.relocateReferences`. */
export interface RelocateOptions extends ThresholdOptions {
  /** Only relocate the references to the resource with this id. */
  readonly resource?: string;
}

/** See `GraphDraft.relocateReferences`. */
export function relocateReferences<S extends UserdataSchema>(
  graph: GraphDraft<S>,
  options: RelocateOptions,
): Issue[] {
  const issues: Issue[] = [];

  for (const node of Object.values(graph.nodes)) {
    const reference = node.type === "atom" ? node.reference : undefined;

    if (
      reference?.resource === undefined ||
      (options.resource !== undefined && reference.resource !== options.resource) ||
      isAnchored(graph.resources[reference.resource].text, reference.text, reference.offset)
    ) {
      continue;
    }

    const { resource, offset } = reference;
    const match = locate(graph.resources[resource].text, reference.text, {
      threshold: options.threshold,
      near: offset,
    });

    if (match === undefined) {
      issues.push(unresolvedReference(node.id, resource));
    } else if (match.text !== reference.text || offset !== undefined) {
      issues.push(
        issue(
          "reference-mismatch",
          `The reference of atom '${node.id}' was moved to offset ${match.offset} of resource '${resource}'.`,
          [node.id, resource],
        ),
      );
    }

    graph.updateAtom(node.id, {
      reference: new Reference({
        text: match?.text ?? reference.text,
        resource,
        offset: match?.offset,
      }),
    });
  }

  return issues;
}
