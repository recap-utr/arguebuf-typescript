import { immerable } from "immer";
import { Metadata } from "./metadata.js";
import {
  initUserdata,
  type Userdata,
  type UserdataInit,
  type UserdataSchema,
} from "./userdata.js";
import { uuid } from "arg-services";

export type EdgeInit<S extends UserdataSchema = {}> = {
  id?: string;
  source: string;
  target: string;
  metadata?: Metadata;
} & UserdataInit<Userdata<S, "edge">>;

export class Edge<S extends UserdataSchema = {}> {
  static [immerable] = true;
  readonly id: string;
  readonly source: string;
  readonly target: string;
  metadata: Metadata;
  userdata: Userdata<S, "edge">;

  constructor(init: EdgeInit<S>) {
    this.id = init.id ?? uuid();
    this.source = init.source;
    this.target = init.target;
    this.metadata = init.metadata ?? new Metadata();
    this.userdata = initUserdata<Userdata<S, "edge">>(init);
  }
}
