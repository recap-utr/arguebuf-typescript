// Subset of the Argdown JSON export (https://argdown.org) read by the loader.
import { z } from "zod";
import { jsonObject, optional, userdata } from "#/schemas/common.js";

export const MemberType = z.enum(["equivalence-class", "argument", "inference"]);
export type MemberType = z.infer<typeof MemberType>;

export type RelationType =
  | "support"
  | "entails"
  | "attack"
  | "undercut"
  | "contrary"
  | "contradictory";

export const Inference = z.object({
  inferenceRules: optional(z.array(z.string())),
  data: optional(jsonObject),
});
export type Inference = z.input<typeof Inference>;

/** Statement that is a member of an equivalence class or an argument, any truthy `isReference` marks a reference. */
export const Member = z.object({
  text: optional(z.string()),
  isReference: z.unknown().optional(),
  data: optional(jsonObject),
});
export type Member = z.input<typeof Member>;
export type MemberOutput = z.output<typeof Member>;

/** Statement of a premise conclusion structure, a conclusion has an inference. */
export const Statement = z.object({
  title: z.string(),
  role: optional(z.string()),
  data: optional(jsonObject),
  inference: optional(Inference),
});
export type Statement = z.input<typeof Statement>;
export type StatementOutput = z.output<typeof Statement>;

export const EquivalenceClass = z.object({
  title: z.string(),
  members: z.array(Member),
  tags: optional(z.array(z.string())),
  data: optional(jsonObject),
});
export type EquivalenceClass = z.input<typeof EquivalenceClass>;
export type EquivalenceClassOutput = z.output<typeof EquivalenceClass>;

export const Argument = z.object({
  title: z.string(),
  members: z.array(Member),
  pcs: z.array(Statement),
  tags: optional(z.array(z.string())),
  data: optional(jsonObject),
});
export type Argument = z.input<typeof Argument>;
export type ArgumentOutput = z.output<typeof Argument>;

/** Members are referenced by title, inferences by argument title and `conclusionIndex`. */
export const Relation = z.object({
  // unknown relation and member types are reported by the loader
  relationType: z.string(),
  from: z.string(),
  fromType: z.string(),
  to: z.string(),
  toType: z.string(),
  conclusionIndex: optional(z.int()),
});
export type Relation = z.input<typeof Relation>;

/** `frontMatter` is not part of the upstream export, `loadArgdown` adds it. */
export const Graph = z.object({
  statements: z.record(z.string(), EquivalenceClass),
  arguments: z.record(z.string(), Argument),
  relations: z.array(Relation),
  frontMatter: userdata,
});
export type Graph = z.input<typeof Graph>;
export type GraphOutput = z.output<typeof Graph>;
