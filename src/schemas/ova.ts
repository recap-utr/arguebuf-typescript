import { z } from "zod";
import { Id, orEmpty } from "#/schemas/common.js";

export const Node = z.object({
  id: Id,
  text: z.string(),
  type: z.string(),
  descriptors: orEmpty(z.record(z.string(), Id.nullable()), () => ({})),
  // "0" means no participant, a missing or unknown one is repaired by the loader
  participantID: Id.nullish().transform((id) => (id === "0" ? undefined : id)),
  // specific to ReCAP OVA
  majorClaim: z.boolean().nullish(),
  date: z.string().nullish(),
});
export type Node = z.input<typeof Node>;
export type NodeOutput = z.output<typeof Node>;

export const Edge = z.object({
  from: z.object({ id: Id }),
  to: z.object({ id: Id }),
  // specific to ReCAP OVA
  date: z.string().nullish(),
});
export type Edge = z.input<typeof Edge>;

export const Participant = z.object({
  id: Id,
  firstname: z.string().nullish(),
  surname: z.string().nullish(),
});
export type Participant = z.input<typeof Participant>;

export const Analysis = z.object({
  txt: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  // specific to ReCAP OVA
  plain_txt: z.string().nullish(),
  documentDate: z.string().nullish(),
  annotatorName: z.string().nullish(),
  documentSource: z.string().nullish(),
  documentTitle: z.string().nullish(),
});
export type Analysis = z.input<typeof Analysis>;

export const Graph = z.object({
  nodes: z.array(Node),
  edges: z.array(Edge),
  participants: z.array(Participant),
  analysis: Analysis,
});
export type Graph = z.input<typeof Graph>;
export type GraphOutput = z.output<typeof Graph>;
