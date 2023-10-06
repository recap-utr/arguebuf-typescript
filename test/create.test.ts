import { expect, test } from "vitest";
import * as arguebuf from "../src/index.js";

test("create graph", () => {
  const g = new arguebuf.Graph();
  g.addAnalyst(
    new arguebuf.Analyst({ name: "John Doe", email: "john@doe.com" })
  );
  expect(Object.keys(g.analysts).length).toStrictEqual(1);

  const gCopy = arguebuf.copy(g);
  expect(gCopy.analysts).toStrictEqual(g.analysts);
});
