import {
  Attack,
  Preference,
  Rephrase,
  type Scheme as ProtobufScheme,
  Support,
} from "arg-services/graph/v1/graph_pb";
import type * as aif from "#/schemas/aif.js";

export { Attack, Preference, Rephrase, Support };

export type Scheme = Readonly<ProtobufScheme["type"]>;
export type SchemeType = Exclude<Scheme["case"], undefined>;

export const schemeTypes: readonly SchemeType[] = ["support", "attack", "rephrase", "preference"];

export const NO_SCHEME_LABEL = "Unknown";

/** Human-readable labels of the supporting argumentation schemes according to Walton et al. */
const supportLabels: Readonly<Record<Support, string>> = {
  [Support.DEFAULT]: "Default",
  [Support.POSITION_TO_KNOW]: "Position to Know",
  [Support.EXPERT_OPINION]: "Expert Opinion",
  [Support.WITNESS_TESTIMONY]: "Witness Testimony",
  [Support.POPULAR_OPINION]: "Popular Opinion",
  [Support.POPULAR_PRACTICE]: "Popular Practice",
  [Support.EXAMPLE]: "Example",
  [Support.ANALOGY]: "Analogy",
  [Support.PRACTICAL_REASONING_FROM_ANALOGY]: "Practical Reasoning from Analogy",
  [Support.COMPOSITION]: "Composition",
  [Support.DIVISION]: "Division",
  [Support.OPPOSITIONS]: "Oppositions",
  [Support.RHETORICAL_OPPOSITIONS]: "Rhetorical Oppositions",
  [Support.ALTERNATIVES]: "Alternatives",
  [Support.VERBAL_CLASSIFICATION]: "Verbal Classification",
  [Support.VERBAL_CLASSIFICATION_DEFINITION]: "Definition to Verbal Classification",
  [Support.VERBAL_CLASSIFICATION_VAGUENESS]: "Vagueness of a Verbal Classification",
  [Support.VERBAL_CLASSIFICATION_ARBITRARINESS]: "Arbitrariness of a Verbal Classification",
  [Support.INTERACTION_OF_ACT_AND_PERSON]: "Interaction of Act and Person",
  [Support.VALUES]: "Values",
  [Support.POSITIVE_VALUES]: "Positive Values",
  [Support.NEGATIVE_VALUES]: "Negative Values",
  [Support.SACRIFICE]: "Sacrifice",
  [Support.THE_GROUP_AND_ITS_MEMBERS]: "The Group and its Members",
  [Support.PRACTICAL_REASONING]: "Practical Reasoning",
  [Support.TWO_PERSON_PRACTICAL_REASONING]: "Two-Person Practical Reasoning",
  [Support.WASTE]: "Waste",
  [Support.SUNK_COSTS]: "Sunk Costs",
  [Support.IGNORANCE]: "Ignorance",
  [Support.EPISTEMIC_IGNORANCE]: "Epistemic Ignorance",
  [Support.CAUSE_TO_EFFECT]: "Cause to Effect",
  [Support.CORRELATION_TO_CAUSE]: "Correlation to Cause",
  [Support.SIGN]: "Sign",
  [Support.ABDUCTIVE]: "Abductive",
  [Support.EVIDENCE_TO_HYPOTHESIS]: "Evidence to Hypothesis",
  [Support.CONSEQUENCES]: "Consequences",
  [Support.POSITIVE_CONSEQUENCES]: "Positive Consequences",
  [Support.NEGATIVE_CONSEQUENCES]: "Negative Consequences",
  [Support.PRAGMATIC_ALTERNATIVES]: "Pragmatic Alternatives",
  [Support.THREAT]: "Threat",
  [Support.FEAR_APPEAL]: "Fear Appeal",
  [Support.DANGER_APPEAL]: "Danger Appeal",
  [Support.NEED_FOR_HELP]: "Need for Help",
  [Support.DISTRESS]: "Distress",
  [Support.COMMITMENT]: "Commitment",
  [Support.ETHOTIC]: "Ethotic",
  [Support.GENERIC_AD_HOMINEM]: "Generic ad Hominem",
  [Support.PRAGMATIC_INCONSISTENCY]: "Pragmatic Inconsistency",
  [Support.INCONSISTENT_COMMITMENT]: "Inconsistent Commitment",
  [Support.CIRCUMSTANTIAL_AD_HOMINEM]: "Circumstantial Ad Hominem",
  [Support.BIAS]: "Bias",
  [Support.BIAS_AD_HOMINEM]: "Bias Ad Hominem",
  [Support.GRADUALISM]: "Gradualism",
  [Support.SLIPPERY_SLOPE]: "Slippery Slope",
  [Support.PRECEDENT_SLIPPERY_SLOPE]: "Precedent Slippery Slope",
  [Support.SORITES_SLIPPERY_SLOPE]: "Sorites Slippery Slope",
  [Support.VERBAL_SLIPPERY_SLOPE]: "Verbal Slippery Slope",
  [Support.FULL_SLIPPERY_SLOPE]: "Full Slippery Slope",
  [Support.CONSTITUTIVE_RULE_CLAIMS]: "Constitutive Rule Claims",
  [Support.RULES]: "Rules",
  [Support.EXCEPTIONAL_CASE]: "Exceptional Case",
  [Support.PRECEDENT]: "Precedent",
  [Support.PLEA_FOR_EXCUSE]: "Plea for Excuse",
  [Support.PERCEPTION]: "Perception",
  [Support.MEMORY]: "Memory",
};

const attackLabels: Readonly<Record<Attack, string>> = { [Attack.DEFAULT]: "Default" };
const rephraseLabels: Readonly<Record<Rephrase, string>> = { [Rephrase.DEFAULT]: "Default" };
const preferenceLabels: Readonly<Record<Preference, string>> = {
  [Preference.DEFAULT]: "Default",
};

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

function lookupTable<V extends number>(
  enumObject: Readonly<Record<string, string | V>>,
  labels: Readonly<Record<V, string>>,
  aliases: Readonly<Record<string, V>> = {},
): ReadonlyMap<string, V> {
  const values = enumValues(enumObject);

  return new Map([
    ...values.map((value) => [normalizeSchemeLabel(labels[value]), value] as const),
    ...Object.entries(aliases).map(([text, value]) => [normalizeSchemeLabel(text), value] as const),
  ]);
}

const supportLookup = lookupTable(Support, supportLabels, supportAliases);
const attackLookup = lookupTable(Attack, attackLabels);
const rephraseLookup = lookupTable(Rephrase, rephraseLabels);
const preferenceLookup = lookupTable(Preference, preferenceLabels);

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
      return enumValues(Support).map((value) => ({ case: type, value }));
    case "attack":
      return enumValues(Attack).map((value) => ({ case: type, value }));
    case "rephrase":
      return enumValues(Rephrase).map((value) => ({ case: type, value }));
    case "preference":
      return enumValues(Preference).map((value) => ({ case: type, value }));
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

const valueLabels: Readonly<Record<SchemeType, Readonly<Record<number, string>>>> = {
  support: supportLabels,
  attack: attackLabels,
  rephrase: rephraseLabels,
  preference: preferenceLabels,
};

/** Whether the scheme value is a member of its enum, protobuf messages may contain others. */
export function isKnownScheme(scheme: Scheme): boolean {
  return scheme.case === undefined || Object.hasOwn(valueLabels[scheme.case], scheme.value);
}

/** Human-readable label of the scheme value, e.g. "Expert Opinion" or "Default". */
export function schemeValueLabel(scheme: Scheme): string {
  return scheme.case === undefined ? NO_SCHEME_LABEL : valueLabels[scheme.case][scheme.value];
}

/** Label of a scheme node, e.g. "Support: Expert Opinion", "Support" for defaults, "Unknown" without scheme. */
export function schemeLabel(scheme: Scheme): string {
  if (scheme.case === undefined) {
    return NO_SCHEME_LABEL;
  }

  const typeLabel = schemeTypeLabels[scheme.case];

  return isDefaultScheme(scheme) ? typeLabel : `${typeLabel}: ${schemeValueLabel(scheme)}`;
}
