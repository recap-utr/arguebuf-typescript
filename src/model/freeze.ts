/**
 * Deeply freeze plain objects and arrays in place and return the value.
 * Other objects such as class instances and typed arrays are kept as they are,
 * frozen objects are skipped together with their contents.
 */
export function freeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value) && isPlain(value)) {
    Object.freeze(value);

    for (const child of Object.values(value)) {
      freeze(child);
    }
  }

  return value;
}

function isPlain(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);

  return Array.isArray(value) || prototype === Object.prototype || prototype === null;
}
