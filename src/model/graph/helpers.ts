// Helpers for the records of a graph, keyed by the ids of their elements.
import { now } from "#/date.js";
import { fail } from "#/issue.js";
import { Metadata } from "#/model/metadata.js";

export type Entity = { readonly id: string };

export function record<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

export function idOf(element: string | Entity): string {
  return typeof element === "string" ? element : element.id;
}

export function drop(store: Record<string, unknown>, id: string): void {
  // oxlint-disable-next-line typescript/no-dynamic-delete
  delete store[id];
}

/** Remove the elements whose ids are not `used`. */
export function dropUnused(
  store: Record<string, unknown>,
  used: ReadonlySet<string | undefined>,
): void {
  for (const id of new Set(Object.keys(store)).difference(used)) {
    drop(store, id);
  }
}

export function isEmpty(record: object): boolean {
  return Object.keys(record).length === 0;
}

export function assertVacant<T extends Entity>(
  store: Record<string, T>,
  element: T,
  kind: string,
): void {
  if (Object.hasOwn(store, element.id)) {
    fail("duplicate-id", `${kind} '${element.id}' already exists.`, [element.id]);
  }
}

export function insert<T extends Entity>(store: Record<string, T>, element: T, kind: string): void {
  assertVacant(store, element, kind);
  store[element.id] = element;
}

export function lookup<T extends Entity>(
  store: Record<string, T>,
  element: string | T,
  kind: string,
): T {
  const id = idOf(element);

  if (!Object.hasOwn(store, id)) {
    fail("unknown-element", `${kind} '${id}' does not exist.`, [id]);
  }

  return store[id];
}

export function remove<T extends Entity>(
  store: Record<string, T>,
  element: string | T,
  kind: string,
): T {
  const removed = lookup(store, element, kind);
  drop(store, removed.id);

  return removed;
}

/** The changes with `updated` set to now, unless they set the metadata themselves. */
export function touched<C extends { readonly metadata?: Metadata }>(
  { metadata }: { readonly metadata: Metadata },
  changes: C,
): C {
  return changes.metadata === undefined
    ? { ...changes, metadata: new Metadata({ created: metadata.created, updated: now() }) }
    : changes;
}
