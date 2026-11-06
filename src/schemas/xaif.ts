import { z } from "zod";
import * as aif from "#/schemas/aif.js";
import { list } from "#/schemas/common.js";

// the fulfillment lists are not read by the loader
const fulfillments = list(z.unknown());

export const Aif = aif.Graph.extend({
  schemefulfillments: fulfillments,
  descriptorfulfillments: fulfillments,
  cqdescriptorfulfillments: fulfillments,
});
export type Aif = z.input<typeof Aif>;

export const Text = z.object({ txt: z.string().nullish() });
export type Text = z.input<typeof Text>;

export const Graph = z.object({
  AIF: Aif,
  text: z.union([z.string(), Text]).nullish(),
  dialog: z.boolean().nullish(),
});
export type Graph = z.input<typeof Graph>;
export type GraphOutput = z.output<typeof Graph>;
