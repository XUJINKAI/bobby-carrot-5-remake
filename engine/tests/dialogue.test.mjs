import test from "node:test";
import assert from "node:assert/strict";
import { ObjectId } from "../dist/index.js";
import { worldEventForObjectTouch } from "../dist/core/object-touch.js";

test("Sandman touch emits dialog(undefined) when no dialogue is authored", () => {
  assert.deepEqual(
    worldEventForObjectTouch({ type: ObjectId.SANDMAN, x: 8, y: 12 }),
    {
      type: "dialog",
      message: "触发对象对白",
      x: 8,
      y: 12,
      objectType: ObjectId.SANDMAN,
    },
  );
});

test("Sandman touch emits authored dialogue", () => {
  assert.deepEqual(
    worldEventForObjectTouch({
      type: ObjectId.SANDMAN,
      x: 8,
      y: 12,
      properties: { dialogue: "作者写的话" },
    }),
    {
      type: "dialog",
      message: "触发对象对白",
      text: "作者写的话",
      x: 8,
      y: 12,
      objectType: ObjectId.SANDMAN,
    },
  );
});

test("Sandman touch preserves stable dialog identity", () => {
  assert.deepEqual(
    worldEventForObjectTouch({
      type: ObjectId.SANDMAN,
      x: 8,
      y: 12,
      properties: { dialogId: "original.map-006.sandman-8-12" },
    }),
    {
      type: "dialog",
      message: "触发对象对白",
      messageId: "original.map-006.sandman-8-12",
      x: 8,
      y: 12,
      objectType: ObjectId.SANDMAN,
    },
  );
});

test("objects without touch behavior emit no event", () => {
  assert.equal(
    worldEventForObjectTouch({ type: ObjectId.CARROT, x: 1, y: 1 }),
    undefined,
  );
});
