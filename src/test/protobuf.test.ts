import { assertType, expect, test } from "vitest";
import * as model from "../model/index.js";
import * as protobufModel from "arg-services/graph/v1/graph_pb";
import * as protobuf from "../converter/protobuf.js";
import * as date from "../services/date.js";

const timestamp = date.now();

/*
  Test atom node
*/
const modelAtomNode: model.AtomNode = new model.AtomNode({
  id: "119935",
  text: "One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt.",
  metadata: new model.Metadata({
    created: timestamp,
    updated: timestamp,
  }),
});

const protobufAtomNode: protobufModel.Node = new protobufModel.Node({
  type: {
    case: "atom",
    value: new protobufModel.Atom({
      text: "One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt.",
    }),
  },
  metadata: new protobufModel.Metadata({
    created: date.toProtobuf(timestamp),
    updated: date.toProtobuf(timestamp),
  }),
});

test("atom node: model2protobuf", () => {
  const protobufNode: protobufModel.Node =
    protobuf.nodeToProtobuf(modelAtomNode);
  expect(protobufNode.type.case).toBe("atom");
  if (protobufNode.type.case === "atom") {
    assertType<protobufModel.Node>(protobufNode);
    expect(protobufNode.type.value.text).toStrictEqual(
      "One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt."
    );
    expect(protobufNode.metadata!.created).toEqual(date.toProtobuf(timestamp));
    expect(protobufNode.metadata!.updated).toEqual(date.toProtobuf(timestamp));
    expect(protobufNode.userdata).toMatchObject({});
  }
});

test("atom node: protobuf2model", () => {
  const modelNode: model.Node = protobuf.nodeFromProtobuf(
    "119935",
    protobufAtomNode
  );
  expect(modelNode.type).toBe("atom");
  if (modelNode.type === "atom") {
    assertType<model.Node>(modelNode);
    expect(modelNode.text).toStrictEqual(
      "One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt."
    );
    expect(modelNode.metadata!.created).toEqual(timestamp);
    expect(modelNode.metadata!.updated).toEqual(timestamp);
    expect(modelNode.userdata).toMatchObject({});
  }
});

/*
  Test scheme node
*/
const modelSchemeNode: model.SchemeNode = new model.SchemeNode({
  id: "119935",
  scheme: {
    case: "attack",
    value: model.Attack.DEFAULT,
  },
  metadata: new model.Metadata({
    created: timestamp,
    updated: timestamp,
  }),
});

const protobufSchemeNode: protobufModel.Node = new protobufModel.Node({
  type: {
    case: "scheme",
    value: new protobufModel.Scheme({
      type: {
        case: "support",
        value: protobufModel.Support.DEFAULT,
      },
    }),
  },
  metadata: new protobufModel.Metadata({
    created: date.toProtobuf(timestamp),
    updated: date.toProtobuf(timestamp),
  }),
});

test("scheme node: model2protobuf", () => {
  const protobufNode: protobufModel.Node =
    protobuf.nodeToProtobuf(modelSchemeNode);
  expect(protobufNode.type.case).toBe("scheme");
  if (protobufNode.type.case === "scheme") {
    assertType<protobufModel.Node>(protobufNode);
    expect(protobufNode.type.value.type.case).toBe("attack");
    expect(protobufNode.type.value.type.value).toBe(
      protobufModel.Attack.DEFAULT
    );
    expect(protobufNode.metadata!.created).toEqual(date.toProtobuf(timestamp));
    expect(protobufNode.metadata!.updated).toEqual(date.toProtobuf(timestamp));
    expect(protobufNode.userdata).toMatchObject({});
    expect(protobufNode.type.value.premiseDescriptors).toEqual([]);
  }
});

test("scheme node: protobuf2model", () => {
  const modelNode: model.Node = protobuf.nodeFromProtobuf(
    "119935",
    protobufSchemeNode
  );
  expect(modelNode.type).toBe("scheme");
  if (modelNode.type === "scheme") {
    assertType<model.Node>(modelNode);
    expect(modelNode.scheme.case).toBe("support");
    expect(modelNode.scheme.value).toBe(protobufModel.Support.DEFAULT);
    expect(modelNode.metadata!.created).toEqual(timestamp);
    expect(modelNode.metadata!.updated).toEqual(timestamp);
    expect(modelNode.userdata).toMatchObject({});
    expect(modelNode.premise_descriptors).toEqual([]);
  }
});
