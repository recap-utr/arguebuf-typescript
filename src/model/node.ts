import {
  Attack,
  Preference,
  Scheme as RawScheme,
  Rephrase,
  Support,
} from "arg-services/graph/v1/graph_pb";
import { immerable } from "immer";
import { Metadata, MetadataInterface } from "./metadata.js";
import { Reference, ReferenceInterface } from "./reference.js";
import { Userdata, UserdataInterface } from "./userdata.js";
import { uuid } from "./utils.js";

export type Scheme = RawScheme["type"];
export type SchemeType = Exclude<Scheme["case"], undefined>;
export { Attack, Preference, Rephrase, Support };

export function nodeLabel(node: NodeInterface): string {
  if (node.type === "atom") {
    return node.text;
  } else if (node.type === "scheme") {
    let text = "Unknown";

    if (node.scheme.case !== undefined) {
      const schemeType = node.scheme.case;
      text = schemeType;

      const schemeValue = scheme2string(node.scheme);

      if (schemeValue !== "DEFAULT") {
        // TODO
      }
    }

    return text;
  }

  return "Unknown";
}

export function scheme2string(scheme: Scheme) {
  switch (scheme.case) {
    case "attack":
      return Attack[scheme.value];
    case "support":
      return Support[scheme.value];
    case "rephrase":
      return Rephrase[scheme.value];
    case "preference":
      return Preference[scheme.value];
    default:
      return "Unknown";
  }
}

export interface AbstractNodeConstructor {
  id?: string;
  metadata?: Metadata;
  userdata?: Userdata;
}

interface AbstractNodeInterface {
  id: string;
  type: "atom" | "scheme";
  metadata: MetadataInterface;
  userdata: UserdataInterface;
}

abstract class AbstractNode implements AbstractNodeInterface {
  [immerable] = true;
  readonly id: string;
  readonly type: "atom" | "scheme";
  metadata: Metadata;
  userdata: Userdata;

  constructor(type: "atom" | "scheme", data: AbstractNodeConstructor) {
    this.id = data.id ?? uuid();
    this.type = type;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data.userdata ?? {};
  }

  // get id(): string {
  //   return "this._id";
  // }

  abstract label(): string;
}

export interface AtomNodeConstructor extends AbstractNodeConstructor {
  text: string;
  reference?: Reference;
  participant?: string;
}

export interface AtomNodeInterface extends AbstractNodeInterface {
  type: "atom";
  text: string;
  reference?: ReferenceInterface;
  participant?: string;
}

export class AtomNode extends AbstractNode implements AtomNodeInterface {
  [immerable] = true;
  declare readonly type: "atom";
  text: string;
  reference?: Reference;
  participant?: string;

  constructor(data: AtomNodeConstructor) {
    super("atom", data);

    this.text = data.text;
    this.reference = data.reference;
    this.participant = data.participant;
  }

  label(): string {
    return nodeLabel(this);
  }
}

export interface SchemeNodeConstructor extends AbstractNodeConstructor {
  scheme?: Scheme;
  premise_descriptors?: Array<string>;
}

export interface SchemeNodeInterface extends AbstractNodeInterface {
  type: "scheme";
  scheme: Scheme;
  premise_descriptors?: Array<string>;
}

export class SchemeNode extends AbstractNode implements SchemeNodeInterface {
  [immerable] = true;
  declare readonly type: "scheme";
  scheme: Scheme;
  premise_descriptors?: Array<string>;

  constructor(data: SchemeNodeConstructor) {
    super("scheme", data);
    this.scheme = data.scheme ?? { case: undefined, value: undefined };
    this.premise_descriptors = data?.premise_descriptors;
  }

  label(): string {
    return nodeLabel(this);
  }
}

export type Node = AtomNode | SchemeNode;
export type NodeInterface = AtomNodeInterface | SchemeNodeInterface;
export type NodeConstructor = AtomNodeConstructor | SchemeNodeConstructor;
