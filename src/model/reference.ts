import { immerable } from "immer";

export interface ReferenceInit {
  text: string;
  resource?: string;
  offset?: number;
}

/** Text span of a resource that an atom node is based on. */
export class Reference {
  static [immerable] = true;
  text: string;
  resource?: string;
  offset?: number;

  constructor(init: ReferenceInit) {
    this.text = init.text;
    this.resource = init.resource;
    this.offset = init.offset;
  }
}
