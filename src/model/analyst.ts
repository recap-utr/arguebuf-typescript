import { immerable } from "immer";
import {
  initUserdata,
  type OptionalInit,
  type Userdata,
  type UserdataInit,
  type UserdataSchema,
} from "./userdata.js";
import { uuid } from "arg-services";

export type AnalystInit<S extends UserdataSchema = {}> = {
  id?: string;
  name?: string;
  email?: string;
} & UserdataInit<Userdata<S, "analyst">>;

export class Analyst<S extends UserdataSchema = {}> {
  static [immerable] = true;
  readonly id: string;
  name?: string;
  email?: string;
  userdata: Userdata<S, "analyst">;

  constructor(...[init]: OptionalInit<AnalystInit<S>>) {
    this.id = init?.id ?? uuid();
    this.name = init?.name;
    this.email = init?.email;
    this.userdata = initUserdata<Userdata<S, "analyst">>(init);
  }
}
