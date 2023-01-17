import * as model from "arg-services/graph/v1/graph_pb";
import { assertType, expect, test } from "vitest";
import * as aif from "../schema/sadface.js";
import * as date from "../services/date.js";
import * as jsonPackage from "../../package.json";

test("node: sadface2arguebuf", () => {
    let aifEdge: aif.Edge = JSON.parse(aifEdgeStr);
    let arguebufEdge = aif.edgeFromAif(aifEdge);
  
    assertType<model.Edge>(arguebufEdge);
    expect(arguebufEdge.source).toBe("119935");
    expect(arguebufEdge.target).toBe("119940");
    expect(arguebufEdge.userdata).toBe(undefined);
});