import { version as arguebufVersion } from "arg-services";
import { Analyst } from "./analyst.js";
import { Edge } from "./edge.js";
import { Metadata } from "./metadata.js";
import { AtomNode, Node } from "./node.js";
import { Participant } from "./participant.js";
import { Resource } from "./resource.js";
import { Userdata } from "./userdata.js";
import { Mutable, ReadonlyObject } from "./utils.js";

export interface Graph {
  readonly nodes: ReadonlyObject<Node>;
  readonly edges: ReadonlyObject<Edge>;
  readonly resources: ReadonlyObject<Resource>;
  readonly participants: ReadonlyObject<Participant>;
  readonly analysts: ReadonlyObject<Analyst>;
  majorClaim?: AtomNode;
  libraryVersion: string;
  schemaVersion: number;
  metadata: Metadata;
  userdata: Userdata;
}

export class Graph {
  constructor(data?: Partial<Graph>) {
    (this as Mutable<Graph>).nodes = data?.nodes ?? {};
    (this as Mutable<Graph>).edges = data?.edges ?? {};
    (this as Mutable<Graph>).resources = data?.resources ?? {};
    (this as Mutable<Graph>).participants = data?.participants ?? {};
    (this as Mutable<Graph>).analysts = data?.analysts ?? {};
    this.majorClaim = data?.majorClaim;
    this.libraryVersion = data?.libraryVersion ?? arguebufVersion;
    this.schemaVersion = data?.schemaVersion ?? 1;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }
}
