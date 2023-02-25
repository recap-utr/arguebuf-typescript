import { Metadata, MetadataInterface } from "./metadata.js";
import { Userdata, UserdataInterface } from "./userdata.js";
import { uuid } from "./utils.js";

export interface EdgeConstructor {
  id?: string;
  source: string;
  target: string;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface EdgeInterface {
  id: string;
  source: string;
  target: string;
  metadata: MetadataInterface;
  userdata: UserdataInterface;
}

export class Edge implements EdgeInterface {
  readonly id: string;
  source: string;
  target: string;
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
