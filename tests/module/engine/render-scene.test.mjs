import test from "node:test";
import assert from "node:assert/strict";
import {
  sortRenderItems,
  sortStandingRenderItems,
} from "../../../engine/dist/render/RenderScene.js";

const item = (id, stackOrder, x, y, visualX = x, visualY = y) => ({
  presence: {
    entityId: id,
    cell: { x, y },
    facts: [],
    stackOrder,
  },
  composition: { layers: [] },
  visualX,
  visualY,
  depthX: visualX,
  depthY: visualY,
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

test("standing ordering uses foot depth before local stackOrder", () => {
  const rearHighStack = item(1, 20, 2, 2);
  const frontLowStack = item(2, 1, 2, 3);
  assert.deepEqual(
    ids(sortStandingRenderItems([frontLowStack, rearHighStack])),
    [1, 2],
  );
});

test("standing ordering keeps every Presence of one body anchor together", () => {
  const head = { ...item(1, 1, 2, 1), depthY: 2 };
  const body = { ...item(1, 1, 2, 2), depthY: 2 };
  const rearBobby = item(2, 5, 2, 1);
  const frontBobby = item(3, 0, 2, 3);
  assert.deepEqual(
    ids(sortStandingRenderItems([frontBobby, body, rearBobby, head])),
    [2, 1, 1, 3],
  );
});
