import { z } from "zod";

// AIFdb uses strings, xAIF tools mostly integers, loaders stringify them
export const Id = z.union([z.string(), z.number().transform(String)]);

export const jsonObject = z.record(z.string(), z.json());

/** Optional value, which is undefined if omitted or null. */
export const optional = <T extends z.ZodType>(schema: T) =>
  schema.nullish().transform((value) => value ?? undefined);

/** Optional value, which is replaced by a new empty one if omitted or null. */
export const orEmpty = <T extends z.ZodType>(schema: T, empty: () => z.output<T>) =>
  schema.nullish().transform((value) => value ?? empty());

/** Userdata of an element, which is empty if omitted. */
export const userdata = orEmpty(jsonObject, () => ({}));

/** Optional list, which is empty if omitted. */
export const list = <T extends z.ZodType>(item: T) => orEmpty(z.array(item), () => []);
