import { immerable } from "immer";
import { DateType } from "../date.js";
import { Metadata, MetadataInterface } from "./metadata.js";
import { Userdata, UserdataInterface } from "./userdata.js";
import { uuid } from "./utils.js";

export interface ResourceConstructor {
  id?: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: DateType;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface ResourceInterface {
  id: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: DateType;
  metadata: MetadataInterface;
  userdata: UserdataInterface;
}

export class Resource implements ResourceInterface {
  [immerable] = true;
  readonly id: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: DateType;
  metadata: Metadata;
  userdata: Userdata;

  constructor(data: ResourceConstructor) {
    this.id = data?.id ?? uuid();
    this.text = data.text;
    this.title = data?.title;
    this.source = data?.source;
    this.timestamp = data?.timestamp;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }
}
