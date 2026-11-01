import { Metadata } from "#/model/metadata.js";
import {
  initUserdata,
  type JsonObject,
  type UserdataInit,
  type Userdata,
  type UserdataSchema,
} from "#/model/userdata.js";
import { uuid } from "#/model/uuid.js";

/** Fields of an edge that `Edge.with` and `GraphDraft.updateEdge` change, its nodes are fixed. */
export type EdgeChanges<U = JsonObject> = Partial<Pick<Edge<U>, "metadata" | "userdata">>;

export type EdgeInit<U = JsonObject> = {
  id?: string;
  source: string;
  target: string;
  metadata?: Metadata;
} & UserdataInit<U>;

/** Directed connection between two nodes, see `GraphDraft.updateEdge` to change it. */
export class Edge<U = JsonObject> {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly metadata: Metadata;
  readonly userdata: U;

  constructor(init: EdgeInit<U>) {
    this.id = init.id ?? uuid();
    this.source = init.source;
    this.target = init.target;
    this.metadata = init.metadata ?? new Metadata();
    this.userdata = initUserdata<U>(init);
    Object.freeze(this);
  }

  /** Copy of the edge with the given fields changed. */
  with(changes: EdgeChanges<U>): Edge<U> {
    const { id, source, target, metadata, userdata } = this;

    return new Edge<U>({ id, source, target, metadata, userdata, ...changes });
  }
}

/** Edge with the userdata of the schema `S`. */
export type EdgeOf<S extends UserdataSchema = {}> = Edge<Userdata<S, "edge">>;
