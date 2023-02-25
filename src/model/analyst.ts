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

  // toJSON() {
  //   return { ...this };
  // }

  // static fromJSON(obj: JSONObject) {
  //   return new Analyst({
  //     id: obj.id,
  //     name: obj.name,
  //     email: obj.email,
  //     userdata: obj.userdata,
  //   });
  // }
}
