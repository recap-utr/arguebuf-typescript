import { uuid } from "arg-services";
import { Userdata } from "./userdata.js";
import { Mutable } from "./utils.js";

export interface Analyst {
  readonly id: string;
  name?: string;
  email?: string;
  userdata: Userdata;
}

export class Analyst {
  constructor(data?: Partial<Analyst>) {
    (this as Mutable<Analyst>).id = data?.id ?? uuid();
    this.name = data?.name;
    this.email = data?.email;
    this.userdata = data?.userdata ?? {};
  }
}
