import { Metadata, MetadataInterface } from "./metadata.js";
import { Userdata } from "./userdata.js";
import { uuid } from "./utils.js";

export interface ParticipantConstructor {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface ParticipantInterface {
  readonly id: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata: MetadataInterface;
  userdata: Userdata;
}

export class Participant {
  readonly id: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata: Metadata;
  userdata: Userdata;

  constructor(data?: ParticipantConstructor) {
    this.id = data?.id ?? uuid();
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
