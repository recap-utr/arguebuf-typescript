import { assert, expect, assertType, test } from 'vitest'
import * as model from "arg-services/arg_services/graph/v1/graph_pb";
import * as aif from "../schema/aif";

const aifData = '{"edgeID": "160913", "fromID": "119935", "toID": "119940", "formEdgeID": null}';

test("edge: aif2arguebuf", () => {
  let aifEdge: aif.Edge = JSON.parse(aifData);
  let arguebufEdge = aif.edgeFromAif(aifEdge);
  
  assertType<model.Edge>(arguebufEdge);
  expect(arguebufEdge.source).toBe("119935");
  expect(arguebufEdge.target).toBe("119940");
  expect(arguebufEdge.userdata).toBe(undefined);
});


export {}
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