export { uuid } from "arg-services";

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Mapping<T extends string | number | symbol, U> = Record<T, U>;
export type PartiallyRequired<T, K extends keyof T> = Pick<T, K> &
  Partial<Omit<T, K>>;
export type PartiallyOptional<T, K extends keyof T> = Pick<T, K> &
  Required<Omit<T, K>>;
