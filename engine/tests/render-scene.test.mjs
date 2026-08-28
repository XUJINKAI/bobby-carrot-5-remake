import test from "node:test";
import assert from "node:assert/strict";
import { sortRenderItems } from "../dist/render/RenderScene.js";

const item = (id, stackOrder, x, y, visualX = x, visualY = y) => ({
  presence: {
    entityId: id,
    cell: { x, y },
    traits: [],
    stackOrder,
  },
  composition: { layers: [] },
  visualX,
  visualY,
});

const ids = (items) => items.map((entry) => entry.presence.entityId);

test("render ordering uses stackOrder and never visualY", () => {
  const lowButMovingDown = item(1, 100, 2, 2, 2, 9.5);
  const highButMovingUp = item(2, 200, 2, 3, 2, -3.5);
  assert.deepEqual(ids(sortRenderItems([highButMovingUp, lowButMovingDown])), [1, 2]);
});

test("entityId is the deterministic fallback for equal stackOrder", () => {
  const laterScan = item(7, 100, 4, 9);
  const earlierId = item(3, 100, 9, 1);
  assert.deepEqual(ids(sortRenderItems([laterScan, earlierId])), [3, 7]);
});
