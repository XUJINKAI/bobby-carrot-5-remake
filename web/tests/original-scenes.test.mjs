import assert from "node:assert/strict";
import { test } from "vitest";
import {
  STAR_ATLAS_CELLS,
  STAR_SPARKLE_SHEET,
  sparkleFrameRect,
  spriteFrameRect,
} from "../src/shared/original-scenes/originalSceneSprites.ts";

test("title stars use the three requested ts atlas cells", () => {
  assert.deepEqual(STAR_ATLAS_CELLS, [
    { column: 7, row: 4 },
    { column: 8, row: 4 },
    { column: 9, row: 4 },
  ]);
});

test("ta title sparkle uses the final two cells as a 6 by 3 sheet", () => {
  assert.equal(STAR_SPARKLE_SHEET.x, 96);
  assert.equal(STAR_SPARKLE_SHEET.y, 672);
  assert.equal(STAR_SPARKLE_SHEET.frameCount, 18);
  assert.deepEqual(sparkleFrameRect(0), {
    x: 96,
    y: 672,
    width: 16,
    height: 16,
  });
  assert.deepEqual(sparkleFrameRect(17), {
    x: 176,
    y: 704,
    width: 16,
    height: 16,
  });
});

test("sprite frames divide b9 style strips without fixed pixel assumptions", () => {
  assert.deepEqual(spriteFrameRect(384, 96, 4, 1, 1), {
    x: 96,
    y: 0,
    width: 96,
    height: 96,
  });
});
