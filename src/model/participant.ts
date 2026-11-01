import { Metadata } from "#/model/metadata.js";
import {
  initUserdata,
  type JsonObject,
  type OptionalInit,
  type UserdataInit,
  type Userdata,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "#/model/uuid.js";

/** Fields of a participant that `Participant.with` and `Graph.updateParticipant` change. */
export type ParticipantChanges<U = JsonObject> = Partial<
  Pick<
    Participant<U>,
    "name" | "username" | "email" | "url" | "location" | "description" | "metadata" | "userdata"
  >
>;

export type ParticipantInit<U = JsonObject> = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata?: Metadata;
} & UserdataInit<U>;

/** Person making statements, see `Graph.updateParticipant` to change it. */
export class Participant<U = JsonObject> {
  readonly id: string;
  readonly name?: string;
  readonly username?: string;
  readonly email?: string;
  readonly url?: string;
  readonly location?: string;
  readonly description?: string;
  readonly metadata: Metadata;
  readonly userdata: U;

  constructor(...[init]: OptionalInit<ParticipantInit<U>>) {
    this.id = init?.id ?? uuid();
    this.name = init?.name;
    this.username = init?.username;
    this.email = init?.email;
    this.url = init?.url;
    this.location = init?.location;
    this.description = init?.description;
    this.metadata = init?.metadata ?? new Metadata();
    this.userdata = initUserdata<U>(init);
  }

  /** Copy of the participant with the given fields changed. */
  with(changes: ParticipantChanges<U>): Participant<U> {
    const { id, name, username, email, url, location, description, metadata, userdata } = this;

    return new Participant<U>({
      id,
      name,
      username,
      email,
      url,
      location,
      description,
      metadata,
      userdata,
      ...changes,
    });
  }
}

/** Participant with the userdata of the schema `S`. */
export type ParticipantOf<S extends UserdataSchema = {}> = Participant<Userdata<S, "participant">>;
