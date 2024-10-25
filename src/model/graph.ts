import { immerable } from "immer";
import { Analyst, AnalystInterface } from "./analyst.js";
import { Edge, EdgeInterface } from "./edge.js";
import { Metadata, MetadataInterface } from "./metadata.js";
import { AtomNode, Node, NodeInterface } from "./node.js";
import { Participant, ParticipantInterface } from "./participant.js";
import { Resource, ResourceInterface } from "./resource.js";
import { Userdata, UserdataInterface } from "./userdata.js";
import { Mapping } from "./utils.js";

type ArrayOrMapping<T> = T[] | Mapping<string, T>;

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
  [immerable] = true;
  protected _nodes: Mapping<string, Node> = {};
  protected _edges: Mapping<string, Edge> = {};
  protected _resources: Mapping<string, Resource> = {};
  protected _participants: Mapping<string, Participant> = {};
  protected _analysts: Mapping<string, Analyst> = {};
  majorClaim?: string;
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

    this.majorClaim = data?.majorClaim;
    this.metadata = data?.metadata ?? new Metadata();
    this.userdata = data?.userdata ?? {};
  }

  get nodes(): Mapping<string, Node> {
    return this._nodes;
  }
  get edges(): Mapping<string, Edge> {
    return this._edges;
  }
  get resources(): Mapping<string, Resource> {
    return this._resources;
  }
  get participants(): Mapping<string, Participant> {
    return this._participants;
  }
  get analysts(): Mapping<string, Analyst> {
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

  addAnalyst(analyst: Analyst) {
    if (analyst.id in this._analysts) {
      throw new Error(`Analyst with id ${analyst.id} already exists`);
    }

    this._analysts[analyst.id] = analyst;
  }

  removeAnalyst(analyst: Analyst | string) {
    const id = typeof analyst === "string" ? analyst : analyst.id;

    if (!(id in this._analysts)) {
      throw new Error(`Analyst with id ${id} does not exist`);
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this._analysts[id];
  }

  addNode(node: Node) {
    if (node.id in this._nodes) {
      throw new Error(`Node with id ${node.id} already exists`);
    }

    this._nodes[node.id] = node;
  }

  removeNode(node: Node | string) {
    const id = typeof node === "string" ? node : node.id;

    if (!(id in this._nodes)) {
      throw new Error(`Node with id ${id} does not exist`);
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this._nodes[id];
  }

  addEdge(edge: Edge) {
    if (edge.id in this._edges) {
      throw new Error(`Edge with id ${edge.id} already exists`);
    }

    this._edges[edge.id] = edge;
  }

  removeEdge(edge: Edge | string) {
    const id = typeof edge === "string" ? edge : edge.id;

    if (!(id in this._edges)) {
      throw new Error(`Edge with id ${id} does not exist`);
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this._edges[id];
  }

  addResource(resource: Resource) {
    if (resource.id in this._resources) {
      throw new Error(`Resource with id ${resource.id} already exists`);
    }

    this._resources[resource.id] = resource;
  }

  removeResource(resource: Resource | string) {
    const id = typeof resource === "string" ? resource : resource.id;

    if (!(id in this._resources)) {
      throw new Error(`Resource with id ${id} does not exist`);
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this._resources[id];
  }

  addParticipant(participant: Participant) {
    if (participant.id in this._participants) {
      throw new Error(`Participant with id ${participant.id} already exists`);
    }

    this._participants[participant.id] = participant;
  }

  removeParticipant(participant: Participant | string) {
    const id = typeof participant === "string" ? participant : participant.id;

    if (!(id in this._participants)) {
      throw new Error(`Participant with id ${id} does not exist`);
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this._participants[id];
  }
}
