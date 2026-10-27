# Arguebuf TypeScript

Arguebuf is a format for serializing argument graphs and specified using Protobuf.
The complete specification and documentation is available at the [Buf Schema Registry](https://buf.build/recap/arg-services/docs/main:arg_services.graph.v1).
While Protobuf automatically generates native code for all major programming languages (including TypeScript), we created a custom implementation that provides some additional benefits, including:

- Import of existing formats like [AIF](http://www.argumentinterchange.org), [SADFace](https://github.com/Open-Argumentation/SADFace), and several others.
- Export of Arguebuf graphs to AIF, xAIF, [graphology](https://graphology.github.io), [Graphviz](https://graphviz.org), and [D2](https://d2lang.com).
- Various helper methods to programmatically manipulate and create argument graphs.
- Model classes that work with [immer](https://immerjs.github.io/immer).

A Python implementation with the same features is available as [arguebuf-python](https://github.com/recap-utr/arguebuf-python).

## Installation

You can install the library from [npm](https://www.npmjs.com/package/arguebuf).

```shell
npm install arguebuf
```

## Usage

When importing this library, we recommend using a namespace import.

```ts
import * as arguebuf from "arguebuf";
```

### Creating a Graph

The following example creates a graph with two premises that are connected to a major claim.

```ts
const graph = new arguebuf.Graph();

const premise1 = new arguebuf.AtomNode({ text: "Text of premise 1" });
const premise2 = new arguebuf.AtomNode({ text: "Text of premise 2" });
const claim = new arguebuf.AtomNode({ text: "Text of claim" });

const scheme1 = new arguebuf.SchemeNode({
  scheme: { case: "support", value: arguebuf.Support.DEFAULT },
});
const scheme2 = new arguebuf.SchemeNode({
  scheme: { case: "attack", value: arguebuf.Attack.DEFAULT },
});

for (const node of [premise1, premise2, claim, scheme1, scheme2]) {
  graph.addNode(node);
}

graph.addEdge(new arguebuf.Edge({ source: premise1.id, target: scheme1.id }));
graph.addEdge(new arguebuf.Edge({ source: scheme1.id, target: claim.id }));
graph.addEdge(new arguebuf.Edge({ source: premise2.id, target: scheme2.id }));
graph.addEdge(new arguebuf.Edge({ source: scheme2.id, target: claim.id }));

graph.majorClaim = claim;
```

### Loading a Graph

The loaders in `arguebuf.load` support the following formats:

- Arguebuf as Protobuf message (`load.protobuf`) or its JSON representation.
- [AIF](http://www.argumentinterchange.org) and its extension xAIF (`load.aif`, `load.xaif`).
- [OVA](http://ova.uni-trier.de) (`load.ova`).
- [SADFace](https://github.com/Open-Argumentation/SADFace) (`load.sadface`).
- The JSON export of [Argdown](https://argdown.org) (`load.argdown`).
- [Kialo](https://www.kialo.com) discussion exports (`load.kialo`).
- [BRAT](https://brat.nlplab.org) standoff annotations (`load.brat`).

JSON objects are passed to `load.json`, which detects their format by checking the following keys in order.

1. An `AIF` key denotes xAIF.
2. An `analysis` key denotes OVA.
3. A `metadata` object with a `core` key denotes SADFace.
4. The keys `statements`, `arguments`, and `relations` denote the Argdown JSON export.
5. A `nodes` array denotes AIF.
6. Everything else is parsed as Arguebuf JSON.

```ts
const graph = arguebuf.load.json(obj, { name: "example", reconstructDialog: true });
```

Every loader accepts `LoadOptions` with an optional `name` for the graph, which is `undefined` by default.
Kialo exports set the name to their discussion title.
`load.aif`, `load.xaif`, and `load.json` accept `AifOptions` whose option `reconstructDialog` connects atoms that are only linked through dialog nodes.
Numeric ids of JSON formats must be integers between `-(2**53 - 1)` and `2**53 - 1` and are converted to strings.
Use strings for larger ids.
The HTML texts of OVA and xAIF are reduced to plain text, only `span` and `br` elements are interpreted.
Reference offsets count Unicode code points, matching Python.

### Strict Model and Lenient Loaders

The graph is strict.
Adding an element throws an error if its id is already taken or if it references an element (e.g., the nodes of an edge or the participant of an atom node) that has not been added to the graph before.
Removing an element also removes or unsets all references to it, e.g., removing a node also removes its edges.

Loaders are lenient.
Edges, major claims, participants, and resources referencing unknown elements are skipped with a `console.warn` message, while malformed values such as unparsable dates throw an error.
Loaders do not copy the objects they read, so the userdata of a graph may share objects with the input.
Use `arguebuf.copy` to get an independent deep copy of a graph.

### Exporting a Graph

The dumpers in `arguebuf.dump` support the following formats:

```ts
// Arguebuf as Protobuf message
const message = arguebuf.dump.protobuf(graph);

// Arguebuf, AIF, or xAIF as JSON object
const obj = arguebuf.dump.json(graph, "aif");

// Graphviz graph as DOT string
const dot = arguebuf.dump.graphviz(graph);

// D2 diagram as string
const d2 = arguebuf.dump.d2(graph);
```

The Graphviz and D2 dumpers return `undefined` for graphs with more than `maxNodes` nodes.
AIF and xAIF exports are lossy, they do not contain locutions, participants of atom nodes, or userdata.

### Userdata

Every graph, node, edge, resource, participant, and analyst has `userdata`, a JSON object by default.
The type parameter of `Graph` customizes it per kind (`graph`, `atom`, `scheme`, `edge`, `resource`, `participant`, `analyst`), omitted kinds keep `JsonObject`.
In memory, userdata may hold anything, for example typed arrays or class instances.

A `Codec` converts between the in-memory userdata and its persisted JSON object.
Loaders call `decode` for every element they create, with its userdata from the input, JSON built by the loader (e.g. the Argdown metadata), or `{}`.
The Protobuf and Arguebuf JSON dumpers call `encode`, so data that should not be persisted is left out there.
Both require codecs exactly for the customized kinds, while AIF, xAIF, Graphviz, and D2 exports need none.
Loaders infer the type of the graph from the codecs.

```ts
interface AtomData {
  label: string;
  embedding?: Float32Array;
}

const atom: arguebuf.Codec<AtomData> = {
  decode: (data) => {
    if (typeof data.label !== "string") {
      throw new TypeError("The label must be a string.");
    }

    return { label: data.label };
  },
  // the embedding is not persisted
  encode: ({ label }) => ({ label }),
};

// arguebuf.Graph<{ atom: AtomData }>
const graph = arguebuf.load.json(obj, { codecs: { atom } });
graph.atomNodes[id].userdata.embedding = embed(graph.atomNodes[id].text);
const json = arguebuf.dump.json(graph, { codecs: { atom } });
```

The method names match the codecs of [Zod](https://zod.dev) 4.1, which can be passed directly.

```ts
import * as z from "zod";

const atom = z.codec(
  z.object({ label: z.string() }),
  z.object({ label: z.string(), embedding: z.instanceof(Float32Array).optional() }),
  { decode: (json) => json, encode: ({ label }) => ({ label }) },
);
```

Constructors make `userdata` optional (defaulting to `{}`) only if `{}` is a valid value of its type.
Likewise, `removeSchemeNodes` requires a userdata factory for the edges it creates if the edge userdata is customized.
`arguebuf.copy` clones userdata with `structuredClone` instead of its codec, so in-memory data is kept, but class instances become plain objects.

For throwaway data like caches, a side table keyed by element ids avoids custom types altogether:

```ts
const embeddings = new Map<string, Float32Array>();
embeddings.set(node.id, embed(node.text));
```

### Dates

All timestamps are immutable `Temporal.Instant` values, `Temporal` is re-exported from [temporal-polyfill](https://github.com/fullcalendar/temporal-polyfill).
Timestamps without timezone are interpreted as UTC.
Each format uses one strict pattern:

- AIF: `YYYY-MM-DD HH:mm:ss`.
- OVA: `DD/MM/YYYY - HH:mm:ss` for nodes and edges and `DD/MM/YYYY` for the document date.
- SADFace: ISO 8601.

Missing creation and modification timestamps default to the current time, malformed timestamps throw an error.

## TypeScript Specifics

### Immer

All model classes are immerable.
Userdata is drafted if it consists of plain objects and arrays, other values (e.g. typed arrays or class instances) are not drafted and must be replaced instead of mutated.
Immer freezes the result of `produce`, so the mutating methods of a graph (e.g. `addNode` or `removeNode`) must be called on the draft inside a recipe, or on graphs that have not been frozen.
Alternatively, disable freezing via `setAutoFreeze(false)`.

### Argdown

The Argdown source loader is a separate entry point, so `@argdown/core` is only needed when using it.
The Argdown JSON export is loaded without it via `load.argdown`.

```ts
import { loadArgdown } from "arguebuf/argdown";

const graph = loadArgdown("[A]: Some claim.\n  + <B>: Some reason.");
```

### Graphology

Graphs are exported to [graphology](https://graphology.github.io) via a separate entry point, so `graphology` is only needed when using it.

```ts
import { dumpGraphology } from "arguebuf/graphology";

const directedGraph = dumpGraphology(graph, { atomAttrs: { text: (node) => node.text } });
```

## Development

Run `nix develop` to install the dependencies and link the testing data to `data/arguebase`.
