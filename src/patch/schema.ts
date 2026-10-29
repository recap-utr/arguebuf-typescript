import type { SchemaObject } from "ajv";
import type { Participant } from "#/model/participant.js";
import { type SchemeType, schemeTypes } from "#/model/scheme.js";

export interface ResourcePatch {
  readonly id: string;
  readonly text?: string;
  readonly title?: string | null;
  readonly source?: string | null;
}

export interface ParticipantPatch {
  readonly id: string;
  readonly name?: string | null;
  readonly username?: string | null;
  readonly email?: string | null;
  readonly url?: string | null;
  readonly location?: string | null;
  readonly description?: string | null;
}

export interface AtomPatch {
  readonly id: string;
  readonly text?: string;
  /** Resource the text is quoted from, `null` removes the reference, all are searched by default. */
  readonly resource?: string | null;
  readonly participant?: string | null;
}

export interface SchemePatch {
  readonly id: string;
  readonly type?: SchemeType;
  /** Label of the scheme of the type, e.g. "Expert Opinion". */
  readonly scheme?: string;
  readonly premises?: readonly string[];
  readonly conclusion?: string;
}

/**
 * Changes to a graph referencing elements by id.
 *
 * An item creates the element if its id is new and otherwise updates the given fields,
 * `null` clears a field.
 * The changes are applied in the order of the fields.
 */
export interface Patch {
  /** Remove all nodes. */
  readonly clear?: boolean;
  /** Ids of nodes, resources, or participants, schemes left without premise or conclusion are removed as well. */
  readonly remove?: readonly string[];
  readonly resources?: readonly ResourcePatch[];
  readonly participants?: readonly ParticipantPatch[];
  readonly atoms?: readonly AtomPatch[];
  readonly schemes?: readonly SchemePatch[];
  readonly majorClaim?: string | null;
}

/** Graph in the shape of a patch, without the texts of resources. */
export interface Outline {
  resources: Omit<ResourcePatch, "text">[];
  participants: ParticipantPatch[];
  atoms: AtomPatch[];
  schemes: SchemePatch[];
  majorClaim?: string;
}

/** JSON Schema 7 object describing a patch or a host extension. */
export type JsonSchema = SchemaObject;

const nullable: JsonSchema = { type: ["string", "null"] };

function itemsSchema(description: string, properties: Record<string, JsonSchema>): JsonSchema {
  return {
    type: "array",
    description,
    items: {
      type: "object",
      properties: { id: { type: "string" }, ...properties },
      required: ["id"],
      additionalProperties: false,
    },
  };
}

export const participantFields = [
  "name",
  "username",
  "email",
  "url",
  "location",
  "description",
] as const satisfies readonly (keyof ParticipantPatch & keyof Participant)[];

/** JSON Schema of `Patch`, e.g. for the tools of agents. */
export const patchSchema: JsonSchema = {
  type: "object",
  description:
    "Changes to an argument graph, applied all or nothing. An item creates the element if its id is new and otherwise updates the given fields, null clears a field.",
  properties: {
    clear: { type: "boolean", description: "Remove all atoms and schemes first." },
    remove: {
      type: "array",
      items: { type: "string" },
      description:
        "Ids of atoms, schemes, resources, or participants. Schemes left without premise or conclusion are removed as well.",
    },
    resources: itemsSchema("Source documents.", {
      text: { type: "string" },
      title: nullable,
      source: nullable,
    }),
    participants: itemsSchema(
      "People making the statements.",
      Object.fromEntries(participantFields.map((key) => [key, nullable])),
    ),
    atoms: itemsSchema("Claims and premises.", {
      text: { type: "string", description: "Quote it verbatim from a resource." },
      resource: {
        type: ["string", "null"],
        description: "Id of the resource the text is quoted from, all are searched by default.",
      },
      participant: nullable,
    }),
    schemes: itemsSchema("Relations from premises to a conclusion.", {
      type: { type: "string", enum: [...schemeTypes] },
      scheme: { type: "string", description: "Argumentation scheme, e.g. Expert Opinion." },
      premises: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        description: "Ids of atoms.",
      },
      conclusion: {
        type: "string",
        description: "Id of an atom or of a scheme to undercut.",
      },
    }),
    majorClaim: { type: ["string", "null"], description: "Id of the atom the argument is about." },
  },
  additionalProperties: false,
};

/** Location in the input, e.g. `["schemes", 2, "premises"]`. */
export type Path = readonly (string | number)[];
