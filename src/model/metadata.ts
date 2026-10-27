import { immerable } from "immer";
import type { Temporal } from "temporal-polyfill";
import { now } from "../date.js";

export interface MetadataInit {
  created?: Temporal.Instant;
  updated?: Temporal.Instant;
}

/** Creation and modification timestamps, `updated` defaults to `created` which defaults to now. */
export class Metadata {
  static [immerable] = true;
  created: Temporal.Instant;
  updated: Temporal.Instant;

  constructor(init: MetadataInit = {}) {
    this.created = init.created ?? now();
    this.updated = init.updated ?? this.created;
  }
}
