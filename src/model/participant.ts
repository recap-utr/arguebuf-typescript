import { uuid } from "arg-services";
import { Metadata } from "./metadata.js";
import { Userdata } from "./userdata.js";
import { Mutable } from "./utils.js";

export interface Participant {
  readonly id: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata: Metadata;
  userdata: Userdata;
}

export class Participant {
  constructor(data?: Partial<Participant>) {
    (this as Mutable<Participant>).id = data?.id ?? uuid();
    this.name = data?.name;
    this.username = data?.username;
    this.email = data?.email;
    this.url = data?.url;
    this.location = data?.location;
    this.description = data?.description;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }
}
