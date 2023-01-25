import { assertType, expect, test } from "vitest";
import * as model from "../model/index.js";
import * as protobufModel from "arg-services/graph/v1/graph_pb";
import * as protobuf from "../converter/protobuf.js";
import * as date from "../services/date.js";


const timestamp = date.now();


// Test atom node
const modelAtomNode: model.AtomNode = new model.AtomNode({
    id: "119935",
    text: "One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt.",
    metadata: new model.Metadata({
        created: timestamp,
        updated: timestamp,
    }),
});

test("atom node: model2protobuf", () => {
    const protobufNode: protobufModel.Node = protobuf.nodeToProtobuf(modelAtomNode);
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


// Test scheme node
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

test("scheme node: model2protobuf", () => {
    const protobufNode: protobufModel.Node = protobuf.nodeToProtobuf(modelSchemeNode);
    expect(protobufNode.type.case).toBe("scheme");
    if (protobufNode.type.case === "scheme") {
        assertType<protobufModel.Node>(protobufNode);
        expect(protobufNode.type.value.type.case).toBe("attack");
        expect(protobufNode.type.value.type.value).toBe(protobufModel.Attack.DEFAULT);
        expect(protobufNode.metadata!.created).toEqual(date.toProtobuf(timestamp));
        expect(protobufNode.metadata!.updated).toEqual(date.toProtobuf(timestamp));
        expect(protobufNode.userdata).toMatchObject({});
        expect(protobufNode.type.value.premiseDescriptors).toEqual([])
    }
});


