import { uuid } from "arg-services";
import {
  Attack,
  Preference,
  Rephrase,
  Scheme as RawScheme,
  Support,
} from "arg-services/graph/v1/graph_pb";
import { Metadata } from "./metadata.js";
import { Participant } from "./participant.js";
import { Reference } from "./reference.js";
import { Userdata } from "./userdata.js";
import { Mutable, PartiallyRequired } from "./utils.js";

export type Scheme = RawScheme["type"];
export type SchemeType = Exclude<Scheme["case"], undefined>;
export { Attack, Preference, Rephrase, Support };

const scheme2string = (scheme: Scheme) => {
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

interface AbstractNode {
  readonly id: string;
  readonly type: "atom" | "scheme";
  metadata: Metadata;
  userdata: Userdata;
}

abstract class AbstractNode {
  constructor(data: Partial<AbstractNode>) {
    (this as Mutable<AbstractNode>).id = data.id ?? uuid();
    // (this as Mutable<AbstractNode>).type = data.type;
    this.metadata = data.metadata ?? new Metadata();
    this.userdata = data.userdata ?? {};
  }

  // get id(): string {
  //   return "this._id";
  // }

  abstract label(): string;
}

export interface AtomNode extends AbstractNode {
  readonly type: "atom";
  text: string;
  readonly reference?: Reference;
  readonly participant?: Participant;
}

export class AtomNode extends AbstractNode {
  constructor(data: PartiallyRequired<AtomNode, "text">) {
    super(data);
    (this as Mutable<AtomNode>).type = "atom";
    this.text = data.text;
    (this as Mutable<AtomNode>).reference = data?.reference;
    (this as Mutable<AtomNode>).participant =
      data?.participant ?? new Participant();
  }

  label(): string {
    return this.text;
  }
}

export interface SchemeNode extends AbstractNode {
  readonly type: "scheme";
  scheme: Scheme;
  premise_descriptors?: Array<string>;
}

export class SchemeNode extends AbstractNode {
  constructor(data: Partial<SchemeNode>) {
    super(data);
    (this as Mutable<SchemeNode>).type = "scheme";
    this.scheme = data.scheme ?? { case: undefined };
    this.premise_descriptors = data?.premise_descriptors;
  }

  label(): string {
    let label = "Unknown";

    if (this.scheme.case !== undefined) {
      const schemeType = this.scheme.case;
      const schemeValue = scheme2string(this.scheme);

      if (schemeValue !== "DEFAULT") {
        // TODO
      }
    }

    return label;
  }
}

export type Node = AtomNode | SchemeNode;
