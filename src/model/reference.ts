import { uuid } from "arg-services";
import { Resource } from "./resource.js";
import { Mutable, PartiallyRequired } from "./utils.js";

export interface Reference {
  readonly id: string;
  readonly resource?: Resource;
  offset?: number;
  text: string;
}

export class Reference {
  constructor(data: PartiallyRequired<Reference, "text">) {
    (this as Mutable<Reference>).id = data?.id ?? uuid();
    (this as Mutable<Reference>).resource = data?.resource;
    this.offset = data?.offset;
    this.text = data.text;
  }
}
