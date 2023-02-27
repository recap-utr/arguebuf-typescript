import {
  Attack,
  Preference,
  Rephrase,
  Scheme as RawScheme,
  Support,
} from "arg-services/graph/v1/graph_pb";
import { Metadata, MetadataInterface } from "./metadata.js";
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

export const scheme2string = (scheme: Scheme) => {
  switch (scheme.case) {
    case "attack":
      return Attack[scheme.value];
    case "support":
      return Support[scheme.value];
    case "rephrase":
      return Rephrase[scheme.value];
    case "preference":
      return Preference[scheme.value];
    case undefined:
      throw new Error("TODO");
  }
};

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
  // reference?: ReferenceConstructor;
  // participant?: ParticipantConstructor;
}

export interface AtomNodeInterface extends AbstractNodeInterface {
  type: "atom";
  text: string;
  // readonly reference?: ReferenceConstructor;
  // readonly participant?: ParticipantConstructor;
}

export class AtomNode extends AbstractNode implements AtomNodeInterface {
  declare readonly type: "atom";
  text: string;
  // readonly reference?: Reference;
  // readonly participant?: Participant;

  constructor(data: AtomNodeConstructor) {
    super("atom", data);

    this.text = data.text;
    // this.reference = new Reference(data?.reference);
    // this.participant = new Participant(data?.participant);
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
