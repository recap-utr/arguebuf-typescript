import { z } from "zod";
import { type SchemeType, schemeTypes } from "#/model/scheme.js";

const id = z.string();

/** Optional field, which is null if omitted. */
const optional = <T extends z.ZodType>(schema: T) => schema.nullable().default(null);

const list = <T extends z.ZodType>(item: T, description: string) =>
  z.array(item).default([]).describe(description);

const resourcePatch = z.strictObject({
  id,
  text: z.string(),
  title: optional(z.string()),
  source: optional(z.string()),
});
const participantPatch = z.strictObject({
  id,
  name: optional(z.string()),
  username: optional(z.string()),
  email: optional(z.string()),
  url: optional(z.string()),
  location: optional(z.string()),
  description: optional(z.string()),
});
const atomPatch = z.strictObject({
  id,
  text: z.string().describe("Quote it verbatim from a resource."),
  resource: optional(id).describe(
    "Id of the resource the text is quoted from, all resources are searched if omitted.",
  ),
  participant: optional(id).describe("Id of the participant."),
});
const schemePatch = z.strictObject({
  id,
  type: z.enum(schemeTypes),
  scheme: optional(z.string()).describe("Argumentation scheme of the type, e.g. Expert Opinion."),
  premises: z.array(id).min(1).describe("Ids of atoms, only supports take several."),
  conclusion: id.describe("Id of an atom or of a scheme."),
});

export const patchSchema = z
  .strictObject({
    clear: z
      .boolean()
      .default(false)
      .describe("Remove all atoms and schemes first, resources and participants are kept."),
    delete: list(
      id,
      "Ids of atoms, schemes, resources, or participants to remove. Schemes left without premise or conclusion are removed as well.",
    ),
    resources: list(resourcePatch, "Source documents."),
    participants: list(participantPatch, "People making the statements."),
    atoms: list(atomPatch, "Claims and premises."),
    schemes: list(schemePatch, "Relations from premises to a conclusion."),
    majorClaim: optional(id).describe(
      "Id of the atom the argument is about, the current one is kept if omitted.",
    ),
  })
  .describe(
    "Changes to an argument graph, applied all or nothing in the order of the fields. An item with a new id of your choice creates the element, an item with an existing id replaces it with all given fields.",
  );

/** Patch that changes a graph, omitted fields take their defaults. */
export type Patch = z.input<typeof patchSchema>;
export type ResourcePatch = z.output<typeof resourcePatch>;
export type ParticipantPatch = z.output<typeof participantPatch>;
export type AtomPatch = z.output<typeof atomPatch>;
export type SchemePatch = z.output<typeof schemePatch>;

/** Resource of an outline, without its text. */
export type ResourceOutline = Omit<ResourcePatch, "text">;

/** Scheme node of an outline, which may be untyped or lack a conclusion. */
export type SchemeOutline = Omit<SchemePatch, "type" | "conclusion"> & {
  type: SchemeType | null;
  conclusion: string | null;
};

/** Graph in the shape of a patch, without the texts of resources. */
export interface Outline {
  resources: ResourceOutline[];
  participants: ParticipantPatch[];
  atoms: AtomPatch[];
  schemes: SchemeOutline[];
  majorClaim: string | null;
}
