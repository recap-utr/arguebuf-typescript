// Subset of the Argdown JSON export (https://argdown.org) read by the loader.
import type { JsonObject } from "@bufbuild/protobuf";

export type MemberType = "equivalence-class" | "argument" | "inference";

export type RelationType =
  | "support"
  | "entails"
  | "attack"
  | "undercut"
  | "contrary"
  | "contradictory";

export interface Inference {
  inferenceRules?: string[];
  data?: JsonObject;
}

export interface Statement {
  title?: string;
  text?: string;
  role?: string;
  isReference?: boolean;
  data?: JsonObject;
  inference?: Inference;
}

export interface EquivalenceClass {
  title: string;
  members: Statement[];
  tags?: string[];
  data?: JsonObject;
}

export interface Argument {
  title: string;
  members: Statement[];
  pcs: Statement[];
  tags?: string[];
  data?: JsonObject;
}

/** Members are referenced by title, inferences by argument title and `conclusionIndex`. */
export interface Relation {
  relationType: RelationType;
  from: string;
  fromType: MemberType;
  to: string;
  toType: MemberType;
  conclusionIndex?: number;
}

/** `frontMatter` is not part of the upstream export, `loadArgdown` adds it. */
export interface Graph {
  statements: Record<string, EquivalenceClass>;
  arguments: Record<string, Argument>;
  relations: Relation[];
  frontMatter?: JsonObject | null;
}
