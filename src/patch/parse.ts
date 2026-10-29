import { Ajv, type ErrorObject } from "ajv";
import { type Issue, issue } from "#/issue.js";
import { type JsonSchema, type Patch, type Path, patchSchema } from "#/patch/schema.js";

export interface ParsedPatch<T extends Patch = Patch> {
  /** The patch if the value is valid. */
  readonly patch?: T;
  readonly issues: readonly Issue[];
}

const validator = new Ajv({ allErrors: true, allowUnionTypes: true });

/** Decode JSON Pointer segments, preserving numeric object keys as strings. */
function errorPath(error: ErrorObject, value: unknown): Path {
  const path: (string | number)[] = [];

  for (const segment of error.instancePath.split("/").slice(1)) {
    const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    path.push(Array.isArray(value) ? Number(key) : key);
    value =
      value !== null && typeof value === "object"
        ? Object.getOwnPropertyDescriptor(value, key)?.value
        : undefined;
  }

  return path;
}

/**
 * Validate untrusted input against `patchSchema` or a host extension describing `T`.
 * Ajv caches compiled schemas and reports all failures as `invalid-patch` issues.
 */
export function parsePatch<T extends Patch = Patch>(
  value: unknown,
  schema: JsonSchema = patchSchema,
): ParsedPatch<T> {
  const validate = validator.compile<T>(schema);

  if (validate(value)) {
    return { patch: value, issues: [] };
  }

  return {
    issues: (validate.errors ?? []).map((error: ErrorObject) => ({
      ...issue("invalid-patch", error.message ?? "Invalid patch."),
      path: errorPath(error, value),
    })),
  };
}
