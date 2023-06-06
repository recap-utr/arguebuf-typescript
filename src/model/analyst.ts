import { immerable } from "immer";
import { Userdata, UserdataInterface } from "./userdata.js";
import { uuid } from "./utils.js";

export interface AnalystConstructor {
  id?: string;
  name?: string;
  email?: string;
  userdata?: Userdata;
}

export interface AnalystInterface {
  id: string;
  name?: string;
  email?: string;
  userdata: UserdataInterface;
}

export class Analyst implements AnalystInterface {
  [immerable] = true;
  readonly id: string;
  name?: string;
  email?: string;
  userdata: Userdata;

  constructor(data?: AnalystConstructor) {
    this.id = data?.id ?? uuid();
    this.name = data?.name;
    this.email = data?.email;
    this.userdata = data?.userdata ?? {};
  }
}
