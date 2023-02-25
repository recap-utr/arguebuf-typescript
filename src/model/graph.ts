import { version as arguebufVersion } from "arg-services";
import { Analyst, AnalystInterface } from "./analyst.js";
import { Edge, EdgeInterface } from "./edge.js";
import { Metadata, MetadataInterface } from "./metadata.js";
import { AtomNode, Node, NodeInterface } from "./node.js";
import { Participant, ParticipantInterface } from "./participant.js";
import { Resource, ResourceInterface } from "./resource.js";
import { Userdata, UserdataInterface } from "./userdata.js";
import { Mapping } from "./utils.js";

type ArrayOrMapping<T> = Array<T> | Mapping<string, T>;

export interface GraphConstructor {
  nodes?: ArrayOrMapping<Node>;
  edges?: ArrayOrMapping<Edge>;
  resources?: ArrayOrMapping<Resource>;
  participants?: ArrayOrMapping<Participant>;
  analysts?: ArrayOrMapping<Analyst>;
  majorClaim?: string;
  metadata?: Metadata;
  userdata?: Userdata;
}

export interface GraphInterface {
  nodes: Mapping<string, NodeInterface>;
  edges: Mapping<string, EdgeInterface>;
  resources: Mapping<string, ResourceInterface>;
  participants: Mapping<string, ParticipantInterface>;
  analysts: Mapping<string, AnalystInterface>;
  majorClaim?: string;
  metadata: MetadataInterface;
  userdata: UserdataInterface;
}

function assign<T extends { id: string }>(data: ArrayOrMapping<T>) {
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((elem) => [elem.id, elem]));
  } else {
    return data;
  }
}

export class Graph implements GraphInterface {
  protected _nodes: Mapping<string, Node> = {};
  protected _edges: Mapping<string, Edge> = {};
  protected _resources: Mapping<string, Resource> = {};
  protected _participants: Mapping<string, Participant> = {};
  protected _analysts: Mapping<string, Analyst> = {};
  majorClaim?: string;
  readonly libraryVersion: string = arguebufVersion;
  readonly schemaVersion: number = 1;
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

  get nodes(): Readonly<Mapping<string, Node>> {
    return this._nodes;
  }
  get edges(): Readonly<Mapping<string, Edge>> {
    return this._edges;
  }
  get resources(): Readonly<Mapping<string, Resource>> {
    return this._resources;
  }
  get participants(): Readonly<Mapping<string, Participant>> {
    return this._participants;
  }
  get analysts(): Readonly<Mapping<string, Analyst>> {
    return this._analysts;
  }

  setElements(nodes: ArrayOrMapping<Node>, edges: ArrayOrMapping<Edge>) {
    this._nodes = assign(nodes);
    this._edges = assign(edges);
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
}
