# Arguebuf TypeScript

Arguebuf is a format for serializing argument graphs and specified using Protobuf.
The complete specification and documentation is available at the [Buf Schema Registry](https://buf.build/recap/arg-services/docs/main:arg_services.graph.v1).
While Protobuf automatically generates native code for all major programming languages (including TypeScript), we created a custom implementation that provides some additional benefits, including:

- Import of existing formats like [AIF](http://www.argumentinterchange.org), [SADFace](https://github.com/Open-Argumentation/SADFace), and several others.
- Export of Arguebuf graphs to AIF, xAIF, [graphology](https://graphology.github.io), [Graphviz](https://graphviz.org), and [D2](https://d2lang.com).
- Various helper methods to programmatically manipulate and create argument graphs.
- Immutable graphs that are changed through cheap drafts, so they can be shared safely, e.g. in an undo history.

A Python implementation with the same features is available as [arguebuf-python](https://github.com/recap-utr/arguebuf-python).

## Installation

You can install the library from [npm](https://www.npmjs.com/package/arguebuf).

```shell
npm install arguebuf
```

The library uses the native [`Temporal`](https://tc39.es/proposal-temporal/docs/) API, so it requires a runtime that provides it (e.g. Node.js 26+) or a global polyfill such as `import "temporal-polyfill/global"`.
For type checking, add `"ESNext.Temporal"` to the `lib` option of your `tsconfig.json`.

## Usage

When importing this library, we recommend using a namespace import.

```ts
import * as arguebuf from "arguebuf";
```

### Creating a Graph

The following example creates a graph with two premises that are connected to a major claim.

```ts
const draft = new arguebuf.GraphDraft();

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
  draft.addNode(node);
}

draft.addEdge(new arguebuf.Edge({ source: premise1.id, target: scheme1.id }));
draft.addEdge(new arguebuf.Edge({ source: scheme1.id, target: claim.id }));
// shorthand for the edges from the premises to the scheme and from the scheme to the claim
draft.connect([premise2], scheme2, claim);

draft.majorClaim = claim;
const graph = draft.freeze();
```

`new arguebuf.Graph({ nodes, edges, ... })` creates a graph from its elements directly.

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
Reference offsets are UTF-16 indices like those of JavaScript strings, so `resource.text.startsWith(reference.text, reference.offset)` holds for an anchored reference.
Serialized formats count code points instead, matching Python, and the loaders and dumpers convert between both.

### Strict Model and Lenient Loaders

The graph is strict.
Adding an element to a draft throws a `GraphError` if its id is already taken or if it references an element (e.g., the nodes of an edge or the participant of an atom node) that has not been added to the graph before.
Edges must not be self-loops, connect two atoms, or duplicate an existing connection.
`draft.link(source, target, { scheme })` connects two nodes and inserts a scheme node (untyped by default) between two atoms, which it returns.
`graph.checkLink(source, target)` returns the issue that prevents such a link without throwing, e.g. to validate a connection while it is drawn.
Removing an element also removes or unsets all references to it, e.g., removing a node also removes its edges.
Elements are immutable, the `update` methods of the draft (`updateAtom`, `updateScheme`, `updateEdge`, `updateResource`, `updateParticipant`, `updateAnalyst`) replace them with changed copies and validate them like the `add` methods.
They set the `updated` timestamp to now unless the changes contain the metadata.
`draft.updateResource` also re-anchors the references to a changed text and returns the resulting warnings.
Scheme nodes left without a premise or without a conclusion are removed together with the node, so that no dangling inferences remain.
`draft.removeElements(ids)` removes elements of any kind at once, all ids must exist and elements that a removal cascades to may be listed as well.
Like `removeNode` and `removeBranch`, it returns the ids of all removed elements, including those of the cascades.
`graph.annotations(resource)` lists the atoms whose references are anchored in a resource with their spans, sorted by position.
Views without scheme nodes, e.g. to show only the hierarchy of claims, are projections that leave the graph unchanged:
`graph.atomRelations()` relates atoms through their scheme nodes, and the Graphviz, D2, and graphology exports accept `schemeNodes: false`.

Loaders are lenient.
They repair what they can and skip the rest: an edge between two atoms gets an untyped scheme in between, while self-loops, duplicate connections, duplicate nodes, and elements referencing unknown ones are skipped.
References whose text is not found at their offset are moved to the most similar span of their resource (see `draft.relocateReferences`).
Each repair is reported as a warning to the `onIssue` option, which defaults to `console.warn`, and the option `strict: true` throws a `GraphError` instead.
Malformed values such as unparsable dates always throw an error.
Loaders do not copy the objects they read, so the userdata of a graph shares the (then frozen) plain objects of the input.

### Issues

Errors and warnings are `Issue` objects that can be serialized as JSON.
Their `code` is identical in all implementations of arguebuf, their `message` names the affected elements, and their `hint` suggests a remedy.
A `GraphError` carries the issue that caused it.

The model cannot prevent everything, e.g. a scheme node without premise is valid while the graph is being built.
`check` reports these remaining problems of a graph, from untyped schemes and dangling references to atoms that are not connected to the major claim.

```ts
for (const issue of arguebuf.check(graph, { ignore: ["no-major-claim"] })) {
  console.log(issue.severity, issue.message, issue.hint);
}
```

### References

`locate` finds the span of a text that matches a quote best, its offset is a UTF-16 index.
Verbatim matches are preferred, otherwise only the words are compared (case, whitespace, and punctuation are ignored) and minor differences are tolerated up to a `threshold` of similarity.

```ts
const match = arguebuf.locate("Cats are the best pets. They are independent.", "they are independant");
// { offset: 24, text: "They are independent", similarity: 0.95 }
```

### Patches for Agents

`applyPatch` applies a `Patch` to a graph, which references all elements by id and is meant to be written by agents.
An item creates an element if its id is new and otherwise updates the given fields, `remove` deletes elements.
Texts of atoms are linked to the most similar spans of the resources.
The patch is applied all or nothing, so the result contains the input graph if there is an error.
Otherwise, the result lists the ids of the `created`, `updated`, and `removed` elements, removed elements include the dangling schemes of removed nodes.
Every issue points to the item that caused it via its `path`, so that an agent can correct it.
Scheme labels that are unknown for their type fall back to the default scheme with an `unknown-scheme` warning.

```ts
const { graph: next, issues } = arguebuf.applyPatch(graph, {
  atoms: [
    { id: "claim", text: "Cats are the best pets" },
    { id: "premise", text: "They are independent" },
  ],
  schemes: [{ id: "support", type: "support", premises: ["premise"], conclusion: "claim" }],
  majorClaim: "claim",
});
```

`outline` returns a graph in the shape of a patch, and `patchSchema` describes patches as JSON Schema for the tools of agents.
`parsePatch` checks untrusted input such as the arguments of a tool call against this schema and reports every problem as an `invalid-patch` error with its path.
Hosts that extend the schema with fields of their own, e.g. explanations of an agent, pass the extended schema to `parsePatch` and remove their fields before calling `applyPatch`.
A scheme can be the conclusion of another scheme, e.g. to undercut it.

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
Elements are typed by their own userdata, e.g. `AtomNode<AtomData>`, so elements of kinds that two schemas do not customize can be shared between their graphs.
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
const { text, userdata } = graph.atomNodes[id];
const next = graph.edit((draft) =>
  draft.updateAtom(id, { userdata: { ...userdata, embedding: embed(text) } }),
);
const json = arguebuf.dump.json(next, { codecs: { atom } });
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
Likewise, `connect` requires a userdata factory for the edges it creates if the edge userdata is customized, and `applyPatch` requires the codecs to create userdata.

For throwaway data like caches, a side table keyed by element ids avoids custom types altogether:

```ts
const embeddings = new Map<string, Float32Array>();
embeddings.set(node.id, embed(node.text));
```

### Dates

All timestamps are immutable `Temporal.Instant` values of the native `Temporal` API.
Timestamps without timezone are interpreted as UTC.
Each format uses one strict pattern:

- AIF: `YYYY-MM-DD HH:mm:ss`.
- OVA: `DD/MM/YYYY - HH:mm:ss` for nodes and edges and `DD/MM/YYYY` for the document date.
- SADFace: ISO 8601.

Missing creation and modification timestamps default to the current time, malformed timestamps throw an error.

## TypeScript Specifics

### Immutability

A `Graph` is frozen together with its elements and their plain userdata (objects and arrays), so it can be shared freely, e.g. in an undo history or a state store.
Other userdata such as class instances or typed arrays is kept as is and must not be changed in place.
Changes go through a `GraphDraft`, which has all methods that change a graph.
`graph.draft()` and `draft.freeze()` are cheap: both share all elements and containers, and a draft clones a container only when it changes it first.
A draft stays usable after `freeze`, and functions that only read accept both as a `GraphView`.

```ts
const next = graph.edit((draft) => {
  draft.updateAtom(id, { text: "New text" });
  draft.majorClaim = id;
});
// `graph` is unchanged
```

`graph.edit(recipe)` works like `produce` of immer: it runs the recipe on a draft and returns the frozen result, so the draft never escapes, and a recipe that throws changes nothing.
`graph.draft()` and `draft.freeze()` are the building blocks for edits that span several steps, e.g. a loader that builds a graph piece by piece.

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
