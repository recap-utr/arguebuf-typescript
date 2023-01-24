import { uuid } from "arg-services";
import { Metadata } from "./metadata.js";
import { Node } from "./node.js";
import { Userdata } from "./userdata.js";
import * as protobuf from "arg-services/graph/v1/graph_pb";
import * as date from "../services/date.js";
import { GeneratePrimeOptionsArrayBuffer } from "crypto";
import { AddressInfo } from "net";
import Module from "module";
import { Struct } from "@bufbuild/protobuf";

export interface EdgeConstructor {
  id?: string;
  source: Node;
  target: Node;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface EdgeInterface {
  readonly id: string;
  readonly source: Node;
  readonly target: Node;
  metadata: Metadata;
  userdata: Userdata;
}

export class Edge implements EdgeInterface {
  readonly id: string;
  readonly source: Node;
  readonly target: Node;
  metadata: Metadata;
  userdata: Userdata;

  constructor(data: EdgeConstructor) {
    this.id = data?.id ?? uuid();
    this.source = data.source;
    this.target = data.target;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }

  toProtobuf(): protobuf.Edge {
    return new protobuf.Edge({
      source: this.source.id,
      target: this.target.id,
      metadata: new protobuf.Metadata({
        created: date.toProtobuf(this.metadata.created),
        updated: date.toProtobuf(this.metadata.updated),
      }),
      userdata: this.userdata,
    });
  }
}
