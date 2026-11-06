import { z } from "zod";
import { Id, list } from "#/schemas/common.js";

export const SchemeType = z.enum(["RA", "CA", "MA", "PA"]);
export type SchemeType = z.infer<typeof SchemeType>;

export const DialogType = z.enum(["L", "TA", "YA"]);
export type DialogType = z.infer<typeof DialogType>;

/** Known node types, others are skipped by the loaders. */
export type NodeType = SchemeType | DialogType | "I";

export const dialogTypes: ReadonlySet<string> = new Set<DialogType>(DialogType.options);

export const Node = z.object({
  nodeID: Id,
  text: z.string(),
  type: z.string(),
  timestamp: z.string().nullish(),
  scheme: z.string().nullish(),
});
export type Node = z.input<typeof Node>;
export type NodeOutput = z.output<typeof Node>;

export const Edge = z.object({
  edgeID: Id,
  fromID: Id,
  toID: Id,
  formEdgeID: Id.nullish(),
});
export type Edge = z.input<typeof Edge>;

export const Locution = z.object({
  nodeID: Id,
  personID: Id,
});
export type Locution = z.input<typeof Locution>;

export const Participant = z.object({
  participantID: Id,
  firstname: z.string().nullish(),
  surname: z.string().nullish(),
});
export type Participant = z.input<typeof Participant>;

export const Graph = z.object({
  nodes: z.array(Node),
  edges: z.array(Edge),
  locutions: list(Locution),
  // only part of xAIF, AIFdb stores the participants separately
  participants: list(Participant),
});
export type Graph = z.input<typeof Graph>;
export type GraphOutput = z.output<typeof Graph>;
