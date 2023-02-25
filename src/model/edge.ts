import { Metadata } from "./metadata.js";
import { Userdata } from "./userdata.js";
import { uuid } from "./utils.js";

export interface EdgeConstructor {
  id?: string;
  source: string;
  target: string;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface EdgeInterface {
  readonly id: string;
  metadata: Metadata;
  userdata: Userdata;
  readonly source: string;
  readonly target: string;
}

export class Edge implements EdgeInterface {
  readonly id: string;
  readonly source: string;
  readonly target: string;
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
