import { getOption } from "@bufbuild/protobuf";
import type { GenEnum } from "@bufbuild/protobuf/codegenv2";
import {
  Attack,
  AttackSchema,
  label,
  Preference,
  PreferenceSchema,
  Rephrase,
  RephraseSchema,
  type Scheme as ProtobufScheme,
  Support,
  SupportSchema,
} from "arg-services/graph/v1/graph_pb";
import type * as aif from "#/schemas/aif.js";

export { Attack, Preference, Rephrase, Support };

export type Scheme = Readonly<ProtobufScheme["type"]>;
export type SchemeType = Exclude<Scheme["case"], undefined>;

export const schemeTypes: readonly SchemeType[] = ["support", "attack", "rephrase", "preference"];

export const NO_SCHEME_LABEL = "Unknown";

/** Human-readable labels of the scheme types. */
export const schemeTypeLabels: Readonly<Record<SchemeType, string>> = {
  support: "Support",
  attack: "Attack",
  rephrase: "Rephrase",
  preference: "Preference",
};

export const scheme2aif: Readonly<Record<SchemeType, Exclude<aif.SchemeType, "">>> = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

export const aif2scheme: Readonly<Record<aif.SchemeType, SchemeType | undefined>> = {
  RA: "support",
  CA: "attack",
  MA: "rephrase",
  PA: "preference",
  "": undefined,
};

export function isAifSchemeType(type: string): type is aif.SchemeType {
  return Object.hasOwn(aif2scheme, type);
}

/** AIFdb labels of the default schemes. */
export const scheme2aifDefault: Readonly<Record<SchemeType, string>> = {
  support: "Default Inference",
  attack: "Default Conflict",
  rephrase: "Default Rephrase",
  preference: "Default Preference",
};

const supportAliases: Readonly<Record<string, Support>> = {
  "Arbitrary Verbal Classification": Support.VERBAL_CLASSIFICATION_ARBITRARINESS,
  "Causal Slippery Slope": Support.SLIPPERY_SLOPE,
  "Direct Ad Hominem": Support.GENERIC_AD_HOMINEM,
  "From-alternatives": Support.ALTERNATIVES,
  "From-analogy": Support.ANALOGY,
  "From-opposition": Support.OPPOSITIONS,
  "From-parts-and-whole": Support.DIVISION,
  Opposition: Support.OPPOSITIONS,
  "Pragmatic Argument From Alternatives": Support.PRAGMATIC_ALTERNATIVES,
  "Vague Verbal Classification": Support.VERBAL_CLASSIFICATION_VAGUENESS,
  "Vagueness Of Verbal Classification": Support.VERBAL_CLASSIFICATION_VAGUENESS,
  "Value Based Practical Reasoning": Support.PRACTICAL_REASONING,
};

/**
 * Make scheme labels comparable regardless of case and separators.
 * Unlike Python's `casefold`, `toLowerCase` keeps characters like "ß" instead of expanding them.
 */
export function normalizeSchemeLabel(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gv, "");
}

/** Members of a numeric enum, without the reverse mappings. */
function enumValues<V extends number>(enumObject: Readonly<Record<string, string | V>>): V[] {
  return Object.values(enumObject).filter((value): value is V => typeof value === "number");
}

/** Human-readable labels of the enum values in their order, given by the `label` option of the schema. */
function labels<V extends number>(
  enumObject: Readonly<Record<string, string | V>>,
  schema: GenEnum<V>,
): ReadonlyMap<V, string> {
  return new Map(
    enumValues(enumObject).map((value) => [value, getOption(schema.value[value], label)] as const),
  );
}

const supportLabels = labels(Support, SupportSchema);
const attackLabels = labels(Attack, AttackSchema);
const rephraseLabels = labels(Rephrase, RephraseSchema);
const preferenceLabels = labels(Preference, PreferenceSchema);

const valueLabels: Readonly<Record<SchemeType, ReadonlyMap<number, string>>> = {
  support: supportLabels,
  attack: attackLabels,
  rephrase: rephraseLabels,
  preference: preferenceLabels,
};

function lookupTable<V extends number>(
  labels: ReadonlyMap<V, string>,
  aliases: Readonly<Record<string, V>> = {},
): ReadonlyMap<string, V> {
  return new Map([
    ...[...labels].map(([value, text]) => [normalizeSchemeLabel(text), value] as const),
    ...Object.entries(aliases).map(([text, value]) => [normalizeSchemeLabel(text), value] as const),
  ]);
}

const supportLookup = lookupTable(supportLabels, supportAliases);
const attackLookup = lookupTable(attackLabels);
const rephraseLookup = lookupTable(rephraseLabels);
const preferenceLookup = lookupTable(preferenceLabels);

/**
 * Get the scheme of the given type whose label matches the text.
 * Labels are compared regardless of case, separators, and an "Argument From" prefix,
 * unknown labels resolve to the default scheme.
 */
export function resolveScheme(type: SchemeType, text: string): Scheme {
  // AIFdb prefixes some labels, e.g. "Argument From Expert Opinion"
  const key = normalizeSchemeLabel(text).replace(/^argumentfrom/, "");

  switch (type) {
    case "support":
      return { case: type, value: supportLookup.get(key) ?? Support.DEFAULT };
    case "attack":
      return { case: type, value: attackLookup.get(key) ?? Attack.DEFAULT };
    case "rephrase":
      return { case: type, value: rephraseLookup.get(key) ?? Rephrase.DEFAULT };
    case "preference":
      return { case: type, value: preferenceLookup.get(key) ?? Preference.DEFAULT };
  }
}

/** A new default scheme of the given type. */
export function defaultScheme(type: SchemeType): Scheme {
  switch (type) {
    case "support":
      return { case: type, value: Support.DEFAULT };
    case "attack":
      return { case: type, value: Attack.DEFAULT };
    case "rephrase":
      return { case: type, value: Rephrase.DEFAULT };
    case "preference":
      return { case: type, value: Preference.DEFAULT };
  }
}

/** All schemes of the given type in the order of their enum. */
export function schemeValues(type: SchemeType): Scheme[] {
  switch (type) {
    case "support":
      return [...supportLabels.keys()].map((value) => ({ case: type, value }));
    case "attack":
      return [...attackLabels.keys()].map((value) => ({ case: type, value }));
    case "rephrase":
      return [...rephraseLabels.keys()].map((value) => ({ case: type, value }));
    case "preference":
      return [...preferenceLabels.keys()].map((value) => ({ case: type, value }));
  }
}

/** Get the scheme of an AIF scheme node, refined by its text if possible. */
export function resolveAifScheme(aifType: aif.SchemeType, text: string): Scheme {
  const type = aif2scheme[aifType];

  return type === undefined ? { case: undefined } : resolveScheme(type, text);
}

export function isDefaultScheme(scheme: Scheme): boolean {
  switch (scheme.case) {
    case "support":
      return scheme.value === Support.DEFAULT;
    case "attack":
      return scheme.value === Attack.DEFAULT;
    case "rephrase":
      return scheme.value === Rephrase.DEFAULT;
    case "preference":
      return scheme.value === Preference.DEFAULT;
    case undefined:
      return false;
  }
}

/** Whether the scheme value is a member of its enum, protobuf messages may contain others. */
export function isKnownScheme(scheme: Scheme): boolean {
  return scheme.case === undefined || valueLabels[scheme.case].has(scheme.value);
}

/** Human-readable label of the scheme value, e.g. "Expert Opinion" or "Default". */
export function schemeValueLabel(scheme: Scheme): string {
  return scheme.case === undefined
    ? NO_SCHEME_LABEL
    : (valueLabels[scheme.case].get(scheme.value) ?? NO_SCHEME_LABEL);
}

/** Label of a scheme node, e.g. "Support: Expert Opinion", "Support" for defaults, "Unknown" without scheme. */
export function schemeLabel(scheme: Scheme): string {
  if (scheme.case === undefined) {
    return NO_SCHEME_LABEL;
  }

  const typeLabel = schemeTypeLabels[scheme.case];

  return isDefaultScheme(scheme) ? typeLabel : `${typeLabel}: ${schemeValueLabel(scheme)}`;
}
