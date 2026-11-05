import { Metadata } from "#/model/metadata.js";
import {
  initUserdata,
  type JsonObject,
  type UserdataInit,
  type Userdata,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "#/model/uuid.js";

/** Fields of a resource that `Resource.with` and `GraphDraft.updateResource` change. */
export type ResourceChanges<U = JsonObject> = Partial<
  Pick<Resource<U>, "text" | "title" | "source" | "timestamp" | "metadata" | "userdata">
>;

export type ResourceInit<U = JsonObject> = {
  id?: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: Temporal.Instant;
  metadata?: Metadata;
} & UserdataInit<U>;

/** Source document that atom nodes may reference, see `GraphDraft.updateResource` to change it. */
export class Resource<U = JsonObject> {
  readonly id: string;
  readonly text: string;
  readonly title?: string;
  readonly source?: string;
  readonly timestamp?: Temporal.Instant;
  readonly metadata: Metadata;
  readonly userdata: U;

  constructor(init: ResourceInit<U>) {
    this.id = init.id ?? uuid();
    this.text = init.text;
    this.title = init.title;
    this.source = init.source;
    this.timestamp = init.timestamp;
    this.metadata = init.metadata ?? new Metadata();
    this.userdata = initUserdata<U>(init);
    Object.freeze(this);
  }

  /** Copy of the resource with the given fields changed. */
  with(changes: ResourceChanges<U>): Resource<U> {
    const { id, text, title, source, timestamp, metadata, userdata } = this;

    return new Resource<U>({ id, text, title, source, timestamp, metadata, userdata, ...changes });
  }
}

/** Resource with the userdata of the schema `S`. */
export type ResourceOf<S extends UserdataSchema = {}> = Resource<Userdata<S, "resource">>;
