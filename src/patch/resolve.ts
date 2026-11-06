import { fail, type Issue, issue } from "#/issue.js";
import { locate, type Match, type ThresholdOptions } from "#/locate.js";
import { Reference } from "#/model/reference.js";
import type { ResourceOf } from "#/model/resource.js";
import {
  defaultScheme,
  isDefaultScheme,
  normalizeSchemeLabel,
  resolveScheme,
  type Scheme,
  type SchemeType,
} from "#/model/scheme.js";
import type { UserdataSchema } from "#/model/userdata.js";

// Fields of patch items resolved to the values of the model, with a warning about the result.

export interface Link {
  readonly reference?: Reference;
  /** Why the text is not linked or only to a similar span. */
  readonly warning?: Issue;
}

export interface ResolvedScheme {
  readonly scheme: Scheme;
  /** Why the default scheme is used instead of the given one. */
  readonly warning?: Issue;
}

/**
 * Link the text of the atom `id` to the most similar span of the resource or,
 * by default, of all resources.
 */
export function linkText<S extends UserdataSchema>(
  resources: Readonly<Record<string, ResourceOf<S>>>,
  id: string,
  text: string,
  resource: string | undefined,
  options: ThresholdOptions,
): Link {
  if (resource !== undefined && !Object.hasOwn(resources, resource)) {
    fail("unknown-element", `Resource '${resource}' does not exist.`, [resource]);
  }

  const candidates = resource === undefined ? Object.values(resources) : [resources[resource]];
  let best: { match: Match; resource: string } | undefined;

  for (const candidate of candidates) {
    const match = locate(candidate.text, text, options);

    if (match !== undefined && match.similarity > (best?.match.similarity ?? 0)) {
      best = { match, resource: candidate.id };
    }
  }

  if (best === undefined) {
    return candidates.length === 0
      ? {}
      : {
          warning: issue(
            "reference-unresolved",
            `The text of atom '${id}' is not found in ${resource === undefined ? "any resource" : `resource '${resource}'`}, so it is not linked.`,
            [id],
          ),
        };
  }

  const { match } = best;
  const reference = new Reference({
    text: match.text,
    resource: best.resource,
    offset: match.offset,
  });

  return match.similarity < 1
    ? {
        reference,
        warning: issue(
          "reference-mismatch",
          `Atom '${id}' is linked to the similar text '${match.text}' of resource '${best.resource}'.`,
          [id, best.resource],
        ),
      }
    : { reference };
}

/** The scheme of the type with the label of the scheme `id`, the default without a label. */
export function resolveSchemeOf(
  id: string,
  type: SchemeType,
  label: string | undefined,
): ResolvedScheme {
  if (label === undefined) {
    return { scheme: defaultScheme(type) };
  }

  const scheme = resolveScheme(type, label);

  return isDefaultScheme(scheme) && normalizeSchemeLabel(label) !== "default"
    ? {
        scheme,
        warning: issue(
          "unknown-scheme",
          `The ${type} scheme '${label}' of '${id}' is unknown, the default is used.`,
          [id],
        ),
      }
    : { scheme };
}
