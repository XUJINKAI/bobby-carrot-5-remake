import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import {
  ORIGINAL_TILE_SIZE,
  STAR_ATLAS_CELLS,
  STAR_SPARKLE_SHEET,
  sparkleFrameRect,
  spriteFrameRect,
} from "../src/shared/original-scenes/originalSceneSprites.ts";

test("Bobby starfield tiles the three requested ts atlas cells", () => {
  assert.equal(ORIGINAL_TILE_SIZE, 48);
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

test("starfield animation is explicit rather than disabled by OS reduced-motion", () => {
  const source = fs.readFileSync(
    new URL("../src/shared/original-scenes/OriginalStarfield.vue", import.meta.url),
    "utf8",
  );
  assert.match(source, /animated\?: boolean/);
  assert.match(source, /scrollSpeed\?: number/);
  assert.match(source, /bigStarProbability\?: number/);
  assert.match(source, /smallStarProbability\?: number/);
  assert.doesNotMatch(source, /prefers-reduced-motion/);
});
