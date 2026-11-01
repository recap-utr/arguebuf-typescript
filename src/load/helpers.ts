// Shared helpers for loaders that repair or skip malformed data and report it.
import type { JsonObject } from "@bufbuild/protobuf";
import {
  catchGraphError,
  GraphError,
  type Issue,
  type IssueCode,
  issue,
  type Reporter,
  warn,
} from "#/issue.js";
import * as model from "#/model/index.js";
import { offsets } from "#/offset.js";
import {
  type CodecArgs,
  type ResolvedCodecs,
  resolveCodecs,
  type UserdataSchema,
} from "#/model/userdata.js";
import type * as argdownSchema from "#/schemas/argdown.js";

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
  /** Receives the repairs and skipped elements as warnings, defaults to `console.warn`. */
  readonly onIssue?: Reporter;
  /** Throw a `GraphError` instead of repairing or skipping malformed data. */
  readonly strict?: boolean;
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

/** Reports a repaired or skipped element as warning. */
export interface Reporting {
  readonly report: (code: IssueCode, message: string, elements?: readonly string[]) => void;
}

/** Codecs of all kinds and the reporter of a loader. */
export interface Context<S extends UserdataSchema> extends Reporting {
  readonly codecs: ResolvedCodecs<S>;
}

/** Options of a loader with its context. */
export function loadOptions<S extends UserdataSchema>(
  ...[options]: LoadArgs<S>
): LoadOptions & Context<S> {
  const onIssue = options?.onIssue ?? warn;
  const forward = (item: Issue) => {
    if (options?.strict) {
      throw new GraphError({ ...item, severity: "error" });
    }

    onIssue(item);
  };

  return {
    ...options,
    codecs: resolveCodecs(options?.codecs),
    report: (code, message, elements) => forward(issue(code, message, elements, "warning")),
  };
}

/** Run the action, reporting the issue of its `GraphError` with the consequence for the input. */
function attempt<S extends UserdataSchema>(
  ctx: Context<S>,
  action: () => void,
  consequence: (code: IssueCode) => string,
): Issue | undefined {
  const error = catchGraphError(action);

  if (error !== undefined) {
    ctx.report(error.code, `${error.message} ${consequence(error.code)}`, error.elements);
  }

  return error;
}

/** Add a node, skipping it with a warning if its id is taken. */
export function addNode<S extends UserdataSchema>(
  graph: model.GraphDraft<S>,
  ctx: Context<S>,
  node: model.Node<S>,
): void {
  attempt(ctx, () => graph.addNode(node), () => "The node was skipped.");
}

/** Re-anchor references that do not match their resource, see `GraphDraft.relocateReferences`. */
export function relocate<S extends UserdataSchema>(graph: model.GraphDraft<S>, ctx: Context<S>): void {
  for (const { code, message, elements } of graph.relocateReferences()) {
    ctx.report(code, message, elements);
  }
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
): model.ParticipantOf<S> {
  return new model.Participant({
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
  ctx: Reporting,
  elements: Readonly<Record<string, V>>,
  id: string | undefined | null,
  kind: string,
  owner: string,
): V | undefined {
  if (!id) {
    return undefined;
  }

  if (!Object.hasOwn(elements, id)) {
    ctx.report("unknown-element", `Skipping unknown ${kind} '${id}' referenced by ${owner}.`, [id]);

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
 * The offset counts code points and is converted to a UTF-16 index of the resource text.
 * An empty or missing id means no resource and keeps the offset,
 * an unknown id is skipped with a warning together with the offset.
 */
export function newReference(
  ctx: Reporting,
  text: string,
  resourceId: string | undefined | null,
  offset: number | undefined | null,
  resources: Readonly<Record<string, { readonly id: string; readonly text: string }>>,
  owner: string,
): model.Reference {
  const resource = lookup(ctx, resources, resourceId, "resource", owner);

  if (offset == null || (Boolean(resourceId) && resource === undefined)) {
    return new model.Reference({ text, resource: resource?.id });
  }

  return new model.Reference({
    text,
    resource: resource?.id,
    offset: resource === undefined ? offset : offsets(resource.text).toUtf16(offset),
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
 * Add an edge between two nodes of the graph, repairing or skipping it with a warning if it is invalid.
 * An edge between two atoms gets an untyped scheme in between, other invalid edges are skipped.
 * Edges of `ignore`d nodes (e.g. skipped dialog nodes) are skipped silently.
 */
export function addEdge<S extends UserdataSchema>(
  graph: model.GraphDraft<S>,
  ctx: Context<S>,
  { userdata = {}, ...init }: EdgeData,
  ignore: ReadonlySet<string> = new Set(),
): void {
  const { source, target } = init;

  if (ignore.has(source) || ignore.has(target)) {
    return;
  }

  const edge = new model.Edge({ ...init, userdata: ctx.codecs.edge.decode(userdata) });
  const error = attempt(
    ctx,
    () => graph.addEdge(edge),
    (code) => (code === "atom-edge" ? "An untyped scheme was inserted." : "The edge was skipped."),
  );

  if (error?.code === "atom-edge") {
    const scheme = new model.SchemeNode({ userdata: ctx.codecs.scheme.decode({}) });
    graph.addNode(scheme);
    const { id, metadata, userdata } = edge;
    graph.addEdge(new model.Edge({ id, source, target: scheme.id, metadata, userdata }));
    graph.addEdge(new model.Edge({ source: scheme.id, target, metadata, userdata }));
  }
}

/**
 * Connect the sources to the target via the scheme node, all given by their ids.
 * The scheme node must already be part of the graph.
 * Edge ids are derived from the node ids as `source->target`,
 * invalid edges are skipped with a warning.
 */
export function connect<S extends UserdataSchema>(
  graph: model.GraphDraft<S>,
  ctx: Context<S>,
  sourceIds: readonly string[],
  schemeId: string,
  targetId: string,
): void {
  const link = (source: string, target: string) =>
    addEdge(graph, ctx, { id: `${source}->${target}`, source, target });

  for (const sourceId of sourceIds) {
    link(sourceId, schemeId);
  }

  link(schemeId, targetId);
}

/** Detect the Argdown JSON export, shared by `load.json` and the Argdown text loader. */
export function isArgdown(obj: object): obj is argdownSchema.Graph {
  return "statements" in obj && "arguments" in obj && "relations" in obj;
}
