import { z } from "zod";
import { Id, list, userdata } from "#/schemas/common.js";

export const Source = z.object({
  resource_id: Id,
  text: z.string(),
  offset: z.int().nullish(),
});
export type Source = z.input<typeof Source>;

// the type of a node is refined by the loader: `scheme` is the generic type of older versions
export const Node = z.object({
  id: Id,
  type: z.string(),
  text: z.string().nullish(),
  name: z.string().nullish(),
  sources: list(Source),
  metadata: userdata,
});
export type Node = z.input<typeof Node>;
export type NodeOutput = z.output<typeof Node>;

export const Edge = z.object({
  id: Id,
  source_id: Id,
  target_id: Id,
});
export type Edge = z.input<typeof Edge>;

export const Resource = z.object({
  id: Id,
  content: z.string().nullish(),
  metadata: userdata,
});
export type Resource = z.input<typeof Resource>;

export const Core = z.object({
  version: z.string().nullish(),
  analyst_email: z.string().nullish(),
  analyst_name: z.string().nullish(),
  created: z.string().nullish(),
  edited: z.string().nullish(),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  title: z.string().nullish(),
});
export type Core = z.input<typeof Core>;

export const Metadata = z.object({ core: Core });
export type Metadata = z.input<typeof Metadata>;

export const Graph = z.object({
  nodes: z.array(Node),
  edges: z.array(Edge),
  metadata: Metadata,
  resources: list(Resource),
});
export type Graph = z.input<typeof Graph>;
export type GraphOutput = z.output<typeof Graph>;
