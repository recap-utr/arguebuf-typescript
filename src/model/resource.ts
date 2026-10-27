import { immerable } from "immer";
import type { Temporal } from "temporal-polyfill";
import { Metadata } from "#/model/metadata.js";
import {
  initUserdata,
  type Userdata,
  type UserdataInit,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "arg-services";

export type ResourceInit<S extends UserdataSchema = {}> = {
  id?: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: Temporal.Instant;
  metadata?: Metadata;
} & UserdataInit<Userdata<S, "resource">>;

/** Source document that atom nodes may reference. */
export class Resource<S extends UserdataSchema = {}> {
  static [immerable] = true;
  readonly id: string;
  text: string;
  title?: string;
  source?: string;
  timestamp?: Temporal.Instant;
  metadata: Metadata;
  userdata: Userdata<S, "resource">;

  constructor(init: ResourceInit<S>) {
    this.id = init.id ?? uuid();
    this.text = init.text;
    this.title = init.title;
    this.source = init.source;
    this.timestamp = init.timestamp;
    this.metadata = init.metadata ?? new Metadata();
    this.userdata = initUserdata<Userdata<S, "resource">>(init);
  }
}
