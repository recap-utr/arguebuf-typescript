import { immerable } from "immer";
import { Metadata } from "#/model/metadata.js";
import {
  initUserdata,
  type OptionalInit,
  type Userdata,
  type UserdataInit,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "arg-services";

export type ParticipantInit<S extends UserdataSchema = {}> = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata?: Metadata;
} & UserdataInit<Userdata<S, "participant">>;

export class Participant<S extends UserdataSchema = {}> {
  static [immerable] = true;
  readonly id: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata: Metadata;
  userdata: Userdata<S, "participant">;

  constructor(...[init]: OptionalInit<ParticipantInit<S>>) {
    this.id = init?.id ?? uuid();
    this.name = init?.name;
    this.username = init?.username;
    this.email = init?.email;
    this.url = init?.url;
    this.location = init?.location;
    this.description = init?.description;
    this.metadata = init?.metadata ?? new Metadata();
    this.userdata = initUserdata<Userdata<S, "participant">>(init);
  }
}
