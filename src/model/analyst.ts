import { uuid } from "arg-services";
import { Userdata } from "./userdata.js";

export interface AnalystConstructor {
  id?: string;
  name?: string;
  email?: string;
  userdata?: Userdata;
}

export interface AnalystInterface {
  readonly id: string;
  name?: string;
  email?: string;
  userdata: Userdata;
}

export class Analyst implements AnalystInterface {
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
