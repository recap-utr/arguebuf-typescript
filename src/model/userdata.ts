import type { JsonObject } from "@bufbuild/protobuf";
import { freeze } from "#/model/freeze.js";

export type { JsonObject, JsonValue } from "@bufbuild/protobuf";

/** Elements of a graph that carry userdata. */
export type UserdataKind =
  | "graph"
  | "atom"
  | "scheme"
  | "edge"
  | "resource"
  | "participant"
  | "analyst";

/** Userdata types by kind, e.g. `{ atom: AtomData }`, omitted kinds use `JsonObject`. */
export type UserdataSchema = { readonly [K in UserdataKind]?: unknown };

/** Userdata type of the kind `K` in the schema `S`. */
export type Userdata<S extends UserdataSchema, K extends UserdataKind> = K extends keyof S
  ? S[K]
  : JsonObject;

/**
 * Conversion between the in-memory userdata and its persisted JSON object.
 *
 * The names match Zod 4.1 codecs, so `z.codec(...)` can be passed directly.
 * Methods keep their parameters bivariant, so a codec may decode a narrower JSON object type.
 */
export interface Codec<T> {
  decode(data: JsonObject): T;
  encode(value: T): JsonObject;
}

/** Codecs for the customized kinds of `S`, the others use the identity. */
export type Codecs<S extends UserdataSchema> = {
  readonly [K in keyof S]: K extends UserdataKind ? Codec<S[K]> : never;
};

/**
 * Options of loaders and dumpers that are only optional if `S` does not customize any kind,
 * otherwise their `codecs` are required.
 */
export type CodecArgs<S extends UserdataSchema, O = {}> = {} extends S
  ? [options?: O & { readonly codecs?: Codecs<S> }]
  : [options: O & { readonly codecs: Codecs<S> }];

/** Userdata of a constructor, optional only if `{}` is a valid value. */
export type UserdataInit<T> = {} extends T ? { userdata?: T } : { userdata: T };

/** Constructor arguments whose init object is optional only if all its fields are. */
export type OptionalInit<I> = {} extends I ? [init?: I] : [init: I];

/** Factory for userdata that a method creates, optional only if `{}` is a valid value. */
export type UserdataFactoryArgs<T> = {} extends T ? [userdata?: () => T] : [userdata: () => T];

/**
 * The supplied userdata, deeply frozen if it is plain data (see `freeze`).
 * Callers only permit omission when `{}` is valid.
 */
export function initUserdata<T>(init: UserdataInit<T> | undefined): T {
  return freeze((init !== undefined && "userdata" in init ? init.userdata : {}) as T);
}

/** Codecs for all kinds of `S`. */
export type ResolvedCodecs<S extends UserdataSchema> = {
  readonly [K in UserdataKind]: Codec<Userdata<S, K>>;
};

const identity: Codec<JsonObject> = { decode: (data) => data, encode: (value) => value };

const IDENTITY: ResolvedCodecs<{}> = {
  graph: identity,
  atom: identity,
  scheme: identity,
  edge: identity,
  resource: identity,
  participant: identity,
  analyst: identity,
};

/**
 * Complete the given codecs with the identity for the kinds that `S` does not customize.
 *
 * `Codecs<S>` lacks a kind exactly if `Userdata<S, K>` is `JsonObject`,
 * but TS cannot follow this for a generic `S`.
 */
export function resolveCodecs<S extends UserdataSchema>(codecs?: Codecs<S>): ResolvedCodecs<S> {
  return { ...IDENTITY, ...codecs } as ResolvedCodecs<S>;
}
