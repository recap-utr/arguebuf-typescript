import { uuid } from "arg-services";
import { Metadata } from "./metadata.js";
import { Node } from "./node.js";
import { Userdata } from "./userdata.js";
import { Mutable, PartiallyRequired } from "./utils.js";

export interface Edge {
  readonly id: string;
  readonly source: Node;
  readonly target: Node;
  metadata: Metadata;
  userdata: Userdata;
}

export class Edge {
  constructor(data: PartiallyRequired<Edge, "source" | "target">) {
    (this as Mutable<Edge>).id = data?.id ?? uuid();
    (this as Mutable<Edge>).source = data.source;
    (this as Mutable<Edge>).target = data.target;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }
}
