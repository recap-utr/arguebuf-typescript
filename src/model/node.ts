import { Metadata } from "#/model/metadata.js";
import type { Reference } from "#/model/reference.js";
import { type Scheme, type SchemeType, schemeLabel } from "#/model/scheme.js";
import {
  initUserdata,
  type JsonObject,
  type OptionalInit,
  type Userdata,
  type UserdataInit,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "arg-services";

/** Color in hexadecimal RGB notation, e.g. `#ffffff`. */
export type HexColor = `#${string}`;

export interface Color {
  readonly bg: HexColor;
  readonly fg: HexColor;
  readonly border: HexColor;
}

function filledColor(bg: HexColor): Color {
  return { bg, fg: "#ffffff", border: bg };
}

const COLOR_MONOCHROME_LIGHT: Color = { bg: "#ffffff", fg: "#000000", border: "#000000" };
const COLOR_MONOCHROME_DARK: Color = { bg: "#000000", fg: "#ffffff", border: "#000000" };
const COLOR_SCHEME_FALLBACK = filledColor("#9E9E9E");
const COLOR_ATOM = filledColor("#2196F3");
const COLOR_MAJOR_CLAIM = filledColor("#0D47A1");

/** Colors of scheme nodes by their type, untyped ones are grey. */
export const schemeColors: Readonly<Record<SchemeType, Color>> = {
  support: filledColor("#4CAF50"),
  attack: filledColor("#F44336"),
  rephrase: filledColor("#009688"),
  preference: filledColor("#9C27B0"),
};

interface NodeInit {
  id?: string;
  metadata?: Metadata;
}

abstract class AbstractNode<U, K extends Node["type"]> {
  readonly id: string;
  abstract readonly type: K;
  readonly metadata: Metadata;
  readonly userdata: U;

  constructor(init: (NodeInit & UserdataInit<U>) | undefined) {
    this.id = init?.id ?? uuid();
    this.metadata = init?.metadata ?? new Metadata();
    this.userdata = initUserdata<U>(init);
  }

  /** Label used when rendering the node. */
  abstract get label(): string;

  /** Color used when rendering the node. */
  abstract color(majorClaim: boolean, monochrome: boolean): Color;
}

/** Fields of an atom node that `AtomNode.with` and `Graph.updateAtom` change. */
export type AtomChanges<U = JsonObject> = Partial<
  Pick<AtomNode<U>, "text" | "reference" | "participant" | "metadata" | "userdata">
>;

export type AtomNodeInit<U = JsonObject> = NodeInit & {
  text: string;
  reference?: Reference;
  participant?: string;
} & UserdataInit<U>;

/**
 * Node containing a claim or premise of an argument.
 *
 * The participant and the resource of the reference must be registered in the graph
 * before the node is added to it, see `Graph.updateAtom` to change it.
 */
export class AtomNode<U = JsonObject> extends AbstractNode<U, "atom"> {
  readonly type = "atom";
  readonly text: string;
  readonly reference?: Reference;
  readonly participant?: string;

  constructor(init: AtomNodeInit<U>) {
    super(init);
    this.text = init.text;
    this.reference = init.reference;
    this.participant = init.participant;
  }

  /** Copy of the node with the given fields changed. */
  with(changes: AtomChanges<U>): AtomNode<U> {
    const { id, text, reference, participant, metadata, userdata } = this;

    return new AtomNode<U>({ id, text, reference, participant, metadata, userdata, ...changes });
  }

  get label(): string {
    return this.text;
  }

  color(majorClaim: boolean, monochrome: boolean): Color {
    if (monochrome) {
      return COLOR_MONOCHROME_LIGHT;
    }

    return majorClaim ? COLOR_MAJOR_CLAIM : COLOR_ATOM;
  }
}

/** Fields of a scheme node that `SchemeNode.with` and `Graph.updateScheme` change. */
export type SchemeChanges<U = JsonObject> = Partial<
  Pick<SchemeNode<U>, "scheme" | "premiseDescriptors" | "metadata" | "userdata">
>;

export type SchemeNodeInit<U = JsonObject> = NodeInit & {
  scheme?: Scheme;
  premiseDescriptors?: readonly string[];
} & UserdataInit<U>;

/** Node describing the relation between atom nodes, see `Graph.updateScheme` to change it. */
export class SchemeNode<U = JsonObject> extends AbstractNode<U, "scheme"> {
  readonly type = "scheme";
  readonly scheme: Scheme;
  readonly premiseDescriptors: readonly string[];

  constructor(...[init]: OptionalInit<SchemeNodeInit<U>>) {
    super(init);
    this.scheme = { ...(init?.scheme ?? { case: undefined }) };
    this.premiseDescriptors = [...(init?.premiseDescriptors ?? [])];
  }

  /** Copy of the node with the given fields changed. */
  with(changes: SchemeChanges<U>): SchemeNode<U> {
    const { id, scheme, premiseDescriptors, metadata, userdata } = this;

    return new SchemeNode<U>({ id, scheme, premiseDescriptors, metadata, userdata, ...changes });
  }

  get label(): string {
    return schemeLabel(this.scheme);
  }

  color(_majorClaim: boolean, monochrome: boolean): Color {
    if (monochrome) {
      return COLOR_MONOCHROME_DARK;
    }

    return this.scheme.case === undefined ? COLOR_SCHEME_FALLBACK : schemeColors[this.scheme.case];
  }
}

/** Atom node with the userdata of the schema `S`. */
export type AtomNodeOf<S extends UserdataSchema = {}> = AtomNode<Userdata<S, "atom">>;

/** Scheme node with the userdata of the schema `S`. */
export type SchemeNodeOf<S extends UserdataSchema = {}> = SchemeNode<Userdata<S, "scheme">>;

/** Atom or scheme node with the userdata of the schema `S`. */
export type Node<S extends UserdataSchema = {}> = AtomNodeOf<S> | SchemeNodeOf<S>;

/** Whether the node has the given type, narrowing it. */
export function isType<N extends Node<UserdataSchema>, T extends N["type"]>(
  node: N,
  type: T,
): node is Extract<N, { type: T }> {
  return node.type === type;
}

/** Node types with their article, e.g. for messages. */
export const typeArticles: Readonly<Record<Node["type"], string>> = {
  atom: "an atom",
  scheme: "a scheme",
};
