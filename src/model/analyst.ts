import {
  initUserdata,
  type JsonObject,
  type OptionalInit,
  type UserdataInit,
  type Userdata,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "#/model/uuid.js";

/** Fields of an analyst that `Analyst.with` and `Graph.updateAnalyst` change. */
export type AnalystChanges<U = JsonObject> = Partial<Pick<Analyst<U>, "name" | "email" | "userdata">>;

export type AnalystInit<U = JsonObject> = {
  id?: string;
  name?: string;
  email?: string;
} & UserdataInit<U>;

/** Person who annotated the graph, see `Graph.updateAnalyst` to change it. */
export class Analyst<U = JsonObject> {
  readonly id: string;
  readonly name?: string;
  readonly email?: string;
  readonly userdata: U;

  constructor(...[init]: OptionalInit<AnalystInit<U>>) {
    this.id = init?.id ?? uuid();
    this.name = init?.name;
    this.email = init?.email;
    this.userdata = initUserdata<U>(init);
  }

  /** Copy of the analyst with the given fields changed. */
  with(changes: AnalystChanges<U>): Analyst<U> {
    const { id, name, email, userdata } = this;

    return new Analyst<U>({ id, name, email, userdata, ...changes });
  }
}

/** Analyst with the userdata of the schema `S`. */
export type AnalystOf<S extends UserdataSchema = {}> = Analyst<Userdata<S, "analyst">>;
