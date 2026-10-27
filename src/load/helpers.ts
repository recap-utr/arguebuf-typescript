// Shared helpers for loaders that skip dangling data with a warning.
import type { JsonObject } from "@bufbuild/protobuf";
import * as model from "../model/index.js";
import {
  type CodecArgs,
  type ResolvedCodecs,
  resolveCodecs,
  type UserdataSchema,
} from "../model/userdata.js";
import type * as argdownSchema from "../schemas/argdown.js";

/**
 * Options accepted by all loaders, together with the `codecs` of `CodecArgs`.
 *
 * Every created element gets the userdata decoded by the codec of its kind
 * from its userdata in the input, from JSON built by the loader, or from `{}`.
 * The default codecs do not clone the input, so userdata objects are shared with it.
 */
export interface LoadOptions {
  /** Name of the graph, a Kialo discussion title takes precedence. */
  readonly name?: string;
}

/** Options of the AIF, xAIF, and JSON loaders. */
export interface AifOptions extends LoadOptions {
  /**
   * Connect atoms that are only linked through dialog nodes (L, TA, YA)
   * to the atoms of adjacent turns via rephrase nodes, otherwise they become isolated.
   */
  readonly reconstructDialog?: boolean;
}

/** Arguments of a loader, the options are required if `S` customizes userdata. */
export type LoadArgs<S extends UserdataSchema, O extends LoadOptions = LoadOptions> = CodecArgs<
  S,
  O
>;

/** Options of a loader with the codecs of all kinds. */
export function loadOptions<S extends UserdataSchema>(
  ...[options]: LoadArgs<S>
): LoadOptions & { readonly codecs: ResolvedCodecs<S> } {
  return { ...options, codecs: resolveCodecs(options?.codecs) };
}

export function warn(message: string): void {
  console.warn(`arguebuf: ${message}`);
}

/**
 * Stringify an id of a JSON format, numbers must be safe integers to agree across languages.
 * Other values (e.g. booleans) are rejected.
 */
export function stringId(id: string | number): string {
  if (typeof id === "string") {
    return id;
  }

  if (typeof id !== "number" || !Number.isSafeInteger(id)) {
    throw new Error(`The id '${String(id)}' is neither a string nor a safe integer.`);
  }

  return String(id);
}

/** Create a participant named by joining the non-empty `names`. */
export function newParticipant<S extends UserdataSchema>(
  codecs: ResolvedCodecs<S>,
  id: string,
  ...names: (string | undefined)[]
): model.Participant<S> {
  return new model.Participant<S>({
    id,
    name: names.filter(Boolean).join(" ") || undefined,
    userdata: codecs.participant.decode({}),
  });
}

/**
 * Get the element referenced by `owner`, warning if the id is unknown.
 * Missing ids (undefined, null, or empty) return undefined without a warning.
 */
export function lookup<V>(
  elements: Readonly<Record<string, V>>,
  id: string | undefined | null,
  kind: string,
  owner: string,
): V | undefined {
  if (!id) {
    return undefined;
  }

  if (!Object.hasOwn(elements, id)) {
    warn(`Skipping unknown ${kind} '${id}' referenced by ${owner}.`);

    return undefined;
  }

  return elements[id];
}

/** Drop the fields whose value is undefined or null. */
export function compact<V>(
  fields: Readonly<Record<string, V | undefined | null>>,
): Record<string, V> {
  return Object.fromEntries(
    Object.entries(fields).filter(
      (entry): entry is [string, V] => entry[1] !== undefined && entry[1] !== null,
    ),
  );
}

/** Split a text into lines at any line break. */
export function lines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

/**
 * Create a reference to the resource with the id `resourceId`.
 * An empty or missing id means no resource and keeps the offset,
 * an unknown id is skipped with a warning together with the offset.
 */
export function newReference(
  text: string,
  resourceId: string | undefined | null,
  offset: number | undefined | null,
  resources: Readonly<Record<string, { readonly id: string }>>,
  owner: string,
): model.Reference {
  const resource = lookup(resources, resourceId, "resource", owner);
  const dangling = Boolean(resourceId) && resource === undefined;

  return new model.Reference({
    text,
    resource: resource?.id,
    offset: dangling ? undefined : (offset ?? undefined),
  });
}

/** Edge to be added by a loader, its userdata is decoded once it is added. */
export interface EdgeData {
  id?: string;
  source: string;
  target: string;
  metadata?: model.Metadata;
  userdata?: JsonObject;
}

/**
 * Add an edge between two nodes of the graph, skipping it with a warning if one is missing.
 * Edges of `ignore`d nodes (e.g. skipped dialog nodes) are skipped silently.
 */
export function addEdge<S extends UserdataSchema>(
  graph: model.Graph<S>,
  codecs: ResolvedCodecs<S>,
  { userdata = {}, ...init }: EdgeData,
  ignore: ReadonlySet<string> = new Set(),
): void {
  const { source, target } = init;

  if (ignore.has(source) || ignore.has(target)) {
    return;
  }

  if (!Object.hasOwn(graph.nodes, source) || !Object.hasOwn(graph.nodes, target)) {
    const id = init.id ?? model.uuid();
    warn(`Skipping edge '${id}': Source '${source}' or target '${target}' not found.`);

    return;
  }

  graph.addEdge(new model.Edge<S>({ ...init, userdata: codecs.edge.decode(userdata) }));
}

/**
 * Connect the sources to the target via the scheme node, all given by their ids.
 * The scheme node must already be part of the graph.
 * Edge ids are derived from the node ids as `source->target`,
 * edges of missing nodes are skipped with a warning.
 */
export function connect<S extends UserdataSchema>(
  graph: model.Graph<S>,
  codecs: ResolvedCodecs<S>,
  sourceIds: readonly string[],
  schemeId: string,
  targetId: string,
): void {
  const link = (source: string, target: string) =>
    addEdge(graph, codecs, { id: `${source}->${target}`, source, target });

  for (const sourceId of sourceIds) {
    link(sourceId, schemeId);
  }

  link(schemeId, targetId);
}

/** Detect the Argdown JSON export, shared by `load.json` and the Argdown text loader. */
export function isArgdown(obj: object): obj is argdownSchema.Graph {
  return "statements" in obj && "arguments" in obj && "relations" in obj;
}
