import { uuid } from "arg-services";
import { Metadata } from "./metadata.js";
import { Node } from "./node.js";
import { Userdata } from "./userdata.js";

export interface EdgeConstructor {
  id?: string;
  source: Node;
  target: Node;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface EdgeInterface {
  readonly id: string;
  readonly source: Node;
  readonly target: Node;
  metadata: Metadata;
  userdata: Userdata;
}

export class Edge implements EdgeInterface {
  readonly id: string;
  readonly source: Node;
  readonly target: Node;
  metadata: Metadata;
  userdata: Userdata;

  constructor(data: EdgeConstructor) {
    this.id = data?.id ?? uuid();
    this.source = data.source;
    this.target = data.target;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }
}
