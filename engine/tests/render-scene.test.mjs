import test from "node:test";
import assert from "node:assert/strict";
import { sortRenderItems } from "../dist/render/RenderScene.js";

const item = (id, stackBand, x, y, visualX = x, visualY = y, stackOrder = 0) => ({
  entity: { id, type: `entity-${id}`, anchor: { x, y } },
  presence: {
    entityId: id,
    cell: { x, y },
    traits: [],
    stackBand,
    stackOrder,
  },
  composition: { layers: [] },
  visualX,
  visualY,
});

test("moving content cannot be covered by a later-scanned surface when moving left/up", () => {
  const bobbyMovingLeft = item(1, "content", 3, 2, 3.5, 2);
  const rightSurface = item(2, "surface", 4, 2);
  const bobbyMovingUp = item(3, "content", 2, 3, 2, 3.5);
  const lowerSurface = item(4, "surface", 2, 4);

  assert.deepEqual(
    sortRenderItems([bobbyMovingLeft, rightSurface]).map((entry) => entry.entity.id),
    [2, 1],
  );
  assert.deepEqual(
    sortRenderItems([bobbyMovingUp, lowerSurface]).map((entry) => entry.entity.id),
    [4, 3],
  );
});

test("content and cover depth follow visual Y instead of persisted cell scan order", () => {
  const moving = item(1, "content", 2, 2, 2, 3.25);
  const nearCover = item(2, "cover", 2, 3, 2, 3);
  const farCover = item(3, "cover", 2, 4, 2, 4);
  assert.deepEqual(
    sortRenderItems([farCover, moving, nearCover]).map((entry) => entry.entity.id),
    [2, 1, 3],
  );
});
