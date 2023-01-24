import { version as arguebufVersion } from "arg-services";
import { Analyst, AnalystInterface } from "./analyst.js";
import { Edge, EdgeInterface } from "./edge.js";
import { Metadata, MetadataInterface } from "./metadata.js";
import { AtomNode, Node, NodeInterface } from "./node.js";
import { Participant, ParticipantInterface } from "./participant.js";
import { Resource, ResourceInterface } from "./resource.js";
import { Userdata } from "./userdata.js";
import { Mapping } from "./utils.js";
import * as protobuf from "arg-services/graph/v1/graph_pb";
import * as date from "../services/date.js";


export interface GraphConstructor {
  nodes?: Array<Node> | Mapping<string, Node>;
  edges?: Array<Edge> | Mapping<string, Edge>;
  resources?: Array<Resource> | Mapping<string, Resource>;
  participants?: Array<Participant> | Mapping<string, Participant>;
  analysts?: Array<Analyst> | Mapping<string, Analyst>;
  majorClaim?: string;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface GraphInterface {
  readonly nodes: Readonly<Mapping<string, NodeInterface>>;
  readonly edges: Readonly<Mapping<string, EdgeInterface>>;
  readonly resources: Readonly<Mapping<string, ResourceInterface>>;
  readonly participants: Readonly<Mapping<string, ParticipantInterface>>;
  readonly analysts: Readonly<Mapping<string, AnalystInterface>>;
  majorClaim?: string;
  metadata: MetadataInterface;
  userdata: Userdata;
}

function assign<T extends Node | Edge | Resource | Participant | Analyst>(
  data: Array<T> | Mapping<string, T>
) {
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((elem) => [elem.id, elem]));
  } else {
    return data;
  }
}

export class Graph implements GraphInterface {
  protected readonly _nodes: Mapping<string, Node> = {};
  protected readonly _edges: Mapping<string, Edge> = {};
  protected readonly _resources: Mapping<string, Resource> = {};
  protected readonly _participants: Mapping<string, Participant> = {};
  protected readonly _analysts: Mapping<string, Analyst> = {};
  majorClaim?: string;
  protected readonly libraryVersion: string = arguebufVersion;
  protected readonly schemaVersion: number = 1;
  metadata: Metadata;
  userdata: Userdata;

  constructor(data?: GraphConstructor) {
    if (data?.nodes !== undefined) {
      this._nodes = assign(data.nodes);
    }
    if (data?.edges !== undefined) {
      this._edges = assign(data.edges);
    }
    if (data?.resources !== undefined) {
      this._resources = assign(data.resources);
    }
    if (data?.participants !== undefined) {
      this._participants = assign(data.participants);
    }
    if (data?.analysts !== undefined) {
      this._analysts = assign(data.analysts);
    }

    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }

  get nodes() {
    return this._nodes;
  }
  get edges() {
    return this._edges;
  }
  get resources() {
    return this._resources;
  }
  get participants() {
    return this._participants;
  }
  get analysts() {
    return this._analysts;
  }

  setMajorClaim(atom: string | AtomNode | undefined) {
    if (typeof atom === "string" || atom === undefined) {
      this.majorClaim = atom;
    } else {
      if (atom.type === "atom") {
        this.majorClaim = atom.id;
      } else {
        throw new Error("Only atom nodes can be used as the major claim");
      }
    }
  }

  toProtobuf(): protobuf.Graph {
    let edges: { [key: string]: protobuf.Edge } = {};
    Object.entries(this.edges).forEach(
      entry => edges[entry[0]] = entry[1].toProtobuf()
    );
    let nodes: { [key: string]: protobuf.Node } = {};
    Object.entries(this.nodes).forEach(
      entry => nodes[entry[0]] = entry[1].toProtobuf()
    );
    let participants: { [key: string]: protobuf.Participant } = {};
    Object.entries(this.participants).forEach(
      entry => participants[entry[0]] = new protobuf.Participant({
        name: entry[1].name,
        description: entry[1].description,
        email: entry[1].email,
        location: entry[1].location,
        metadata: new protobuf.Metadata({
          created: date.toProtobuf(entry[1].metadata.created),
          updated: date.toProtobuf(entry[1].metadata.updated),
        }),
        url: entry[1].url,
        userdata: entry[1].userdata,
        username: entry[1].username,
      })
    );
    let resources: { [key: string]: protobuf.Resource } = {};
    Object.entries(this.resources).forEach(
      entry => resources[entry[0]] = new protobuf.Resource({
        source: entry[1].source,
        text: entry[1].text,
        timestamp: entry[1].timestamp === undefined? undefined: date.toProtobuf(entry[1].timestamp),
        title: entry[1].title,
        metadata: new protobuf.Metadata({
          created: date.toProtobuf(entry[1].metadata.created),
          updated: date.toProtobuf(entry[1].metadata.updated),
        }),
        userdata: entry[1].userdata,
      })
    );
    return new protobuf.Graph({
      nodes: nodes,
      edges: edges,
      schemaVersion: this.schemaVersion,
      analysts: this.analysts,
      libraryVersion: this.libraryVersion,
      majorClaim: this.majorClaim,
      metadata: new protobuf.Metadata({
        created: date.toProtobuf(this.metadata.created),
        updated: date.toProtobuf(this.metadata.updated),
      }),
      userdata: this.userdata,
      participants: participants,
      resources: resources,
    });
  }

  toJSON() { }
}
