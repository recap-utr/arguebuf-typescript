import { uuid } from "arg-services";
import { DateType } from "../services/date.js";
import { Metadata } from "./metadata.js";
import { Userdata } from "./userdata.js";
import { Mutable, PartiallyRequired } from "./utils.js";

export interface Resource {
  readonly id: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: DateType;
  metadata: Metadata;
  userdata: Userdata;
}

export class Resource {
  constructor(data: PartiallyRequired<Resource, "text">) {
    (this as Mutable<Resource>).id = data?.id ?? uuid();
    this.text = data.text;
    this.title = data?.title;
    this.source = data?.source;
    this.timestamp = data?.timestamp;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }
}
