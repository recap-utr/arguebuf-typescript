import { assert, expect, assertType, test } from 'vitest'
import * as date from "../services/date";
import * as model from "arg-services/arg_services/graph/v1/graph_pb";
import * as aif from "../schema/aif";

const aifEdgeStr = '{\
  "edgeID": "160913",\
  "fromID": "119935",\
  "toID": "119940",\
  "formEdgeID": null\
}';

test("edge: aif2arguebuf", () => {
  let aifEdge: aif.Edge = JSON.parse(aifEdgeStr);
  let arguebufEdge = aif.edgeFromAif(aifEdge);

  assertType<model.Edge>(arguebufEdge);
  expect(arguebufEdge.source).toBe("119935");
  expect(arguebufEdge.target).toBe("119940");
  expect(arguebufEdge.userdata).toBe(undefined);
});

const aifNodeStr = '{\
  "nodeID": "119935",\
  "text": "One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt.",\
  "type": "I",\
  "timestamp": "2015-12-14 12:09:15"\
}';

test("node: aif2arguebuf", () => {
  let aifNode = JSON.parse(aifNodeStr)
  let arguebufNode: model.Node = aif.nodeFromAif(aifNode);

  if (arguebufNode.type.oneofKind === "atom") {
    let arguebufAtom: model.Atom = arguebufNode.type.atom;
    assertType<model.Node>(arguebufNode);
    expect(arguebufNode.type.oneofKind).toBe("atom");
    expect(arguebufAtom.text).toBe("One can hardly move in Friedrichshain or Neukölln these days without permanently scanning the ground for dog dirt.");
    expect(arguebufNode.metadata?.created?.seconds).toBe(date.toProtobuf("2015-12-14 12:09:15").seconds);
    expect(arguebufNode.metadata?.updated?.seconds).toBe(date.toProtobuf("2015-12-14 12:09:15").seconds);

  }
});

test("graph: aif2arguebuf", () => {
  let aifEdge: aif.Edge = JSON.parse(aifEdgeStr);
  let arguebufEdge = aif.edgeFromAif(aifEdge);

  assertType<model.Edge>(arguebufEdge);
  expect(arguebufEdge.source).toBe("119935");
  expect(arguebufEdge.target).toBe("119940");
  expect(arguebufEdge.userdata).toBe(undefined);
});

export { }
/*
test('Math.sqrt()', () => {
  expect(Math.sqrt(4)).toBe(2)
  expect(Math.sqrt(144)).toBe(12)
  expect(Math.sqrt(2)).toBe(Math.SQRT2)
});
*/

/*
test('JSON', () => {
  const input = {
    foo: 'hello',
    bar: 'world',
  }

  const output = JSON.stringify(input)

  expect(output).eq('{"foo":"hello","bar":"world"}')
  assert.deepEqual(JSON.parse(output), input, 'matches original')
})
*/