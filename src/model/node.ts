import { immerable } from "immer";
import { Metadata } from "./metadata.js";
import type { Reference } from "./reference.js";
import { type Scheme, type SchemeType, schemeLabel } from "./scheme.js";
import {
  initUserdata,
  type Userdata,
  type OptionalInit,
  type UserdataInit,
  type UserdataSchema,
} from "./userdata.js";
import { uuid } from "arg-services";

export interface Color {
  readonly bg: string;
  readonly fg: string;
  readonly border: string;
}

function filledColor(bg: string): Color {
  return { bg, fg: "#ffffff", border: bg };
}

const COLOR_MONOCHROME_LIGHT: Color = { bg: "#ffffff", fg: "#000000", border: "#000000" };
const COLOR_MONOCHROME_DARK: Color = { bg: "#000000", fg: "#ffffff", border: "#000000" };
const COLOR_SCHEME_FALLBACK = filledColor("#009688");
const COLOR_ATOM = filledColor("#2196F3");
const COLOR_MAJOR_CLAIM = filledColor("#0D47A1");

const scheme2color: Readonly<Record<SchemeType, Color>> = {
  support: filledColor("#4CAF50"),
  attack: filledColor("#F44336"),
  rephrase: filledColor("#009688"),
  preference: filledColor("#009688"),
};

interface NodeInit {
  id?: string;
  metadata?: Metadata;
}

abstract class AbstractNode<S extends UserdataSchema, K extends Node["type"]> {
  static [immerable] = true;
  readonly id: string;
  abstract readonly type: K;
  metadata: Metadata;
  userdata: Userdata<S, K>;

  constructor(init: (NodeInit & UserdataInit<Userdata<S, K>>) | undefined) {
    this.id = init?.id ?? uuid();
    this.metadata = init?.metadata ?? new Metadata();
    this.userdata = initUserdata<Userdata<S, K>>(init);
  }

  /** Label used when rendering the node. */
  abstract get label(): string;

  /** Color used when rendering the node. */
  abstract color(majorClaim: boolean, monochrome: boolean): Color;
}

export type AtomNodeInit<S extends UserdataSchema = {}> = NodeInit & {
  text: string;
  reference?: Reference;
  participant?: string;
} & UserdataInit<Userdata<S, "atom">>;

/**
 * Node containing a claim or premise of an argument.
 *
 * The participant and the resource of the reference must be registered
 * in the graph before the node is added to it, later assignments are not checked.
 */
export class AtomNode<S extends UserdataSchema = {}> extends AbstractNode<S, "atom"> {
  readonly type = "atom";
  text: string;
  reference?: Reference;
  participant?: string;

  constructor(init: AtomNodeInit<S>) {
    super(init);
    this.text = init.text;
    this.reference = init.reference;
    this.participant = init.participant;
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

export type SchemeNodeInit<S extends UserdataSchema = {}> = NodeInit & {
  scheme?: Scheme;
  premiseDescriptors?: readonly string[];
} & UserdataInit<Userdata<S, "scheme">>;

/** Node describing the relation between atom nodes. */
export class SchemeNode<S extends UserdataSchema = {}> extends AbstractNode<S, "scheme"> {
  readonly type = "scheme";
  scheme: Scheme;
  premiseDescriptors: string[];

  constructor(...[init]: OptionalInit<SchemeNodeInit<S>>) {
    super(init);
    this.scheme = { ...(init?.scheme ?? { case: undefined }) };
    this.premiseDescriptors = [...(init?.premiseDescriptors ?? [])];
  }

  get label(): string {
    return schemeLabel(this.scheme);
  }

  color(_majorClaim: boolean, monochrome: boolean): Color {
    if (monochrome) {
      return COLOR_MONOCHROME_DARK;
    }

    return this.scheme.case === undefined ? COLOR_SCHEME_FALLBACK : scheme2color[this.scheme.case];
  }
}

export type Node<S extends UserdataSchema = {}> = AtomNode<S> | SchemeNode<S>;
