import { Resource, ResourceInterface } from "./resource.js";
import { uuid } from "./utils.js";

export interface ReferenceConstructor {
  id?: string;
  resource?: Resource;
  offset?: number;
  text: string;
}

export interface ReferenceInterface {
  id: string;
  resource?: ResourceInterface;
  offset?: number;
  text: string;
}

export class Reference implements ReferenceInterface {
  readonly id: string;
  readonly resource?: Resource;
  offset?: number;
  text: string;

  constructor(data: ReferenceConstructor) {
    this.id = data?.id ?? uuid();
    this.resource = data?.resource;
    this.offset = data?.offset;
    this.text = data.text;
  }
}
