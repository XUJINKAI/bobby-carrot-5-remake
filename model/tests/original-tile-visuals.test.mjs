import assert from "node:assert/strict";
import test from "node:test";
import {
  ENTITY_MAP_DEFINITIONS,
  MapEntityTypeId,
  ORIGINAL_TILE_ANIMATIONS,
  ORIGINAL_TILE_ATLASES,
  ORIGINAL_TILE_VISUALS,
  originalTileAnimation,
  originalTileAtlasCell,
  originalTileVisual,
  originalTileVisualGroup,
} from "../dist/index.js";

test("Map Entity ID 与 Definition 使用同一完整集合", () => {
  assert.deepEqual(
    [...new Set(Object.values(MapEntityTypeId))].sort(),
    Object.keys(ENTITY_MAP_DEFINITIONS).sort(),
  );
});

test("Original Tile Visual 目录完整覆盖 ts.png", () => {
  const ts = ORIGINAL_TILE_ATLASES.ts;
  assert.equal(ORIGINAL_TILE_VISUALS.length, ts.rows * ts.columns);
  for (let row = 1; row <= ts.rows; row += 1) {
    for (let column = 1; column <= ts.columns; column += 1) {
      assert.ok(originalTileAtlasCell("ts", row, column), `${row}-${column}`);
    }
  }
});

test("Surface 与 Palette 分类及 selector 具有确定语义", () => {
  assert.equal(originalTileVisualGroup("water").panel, "surface");
  assert.equal(originalTileVisualGroup("dragon").panel, "palette");
  assert.equal(
    originalTileVisual({ type: "water", fields: { variant: "ripple" } }).cell,
    "6-7",
  );
  assert.equal(
    originalTileVisual({ type: "dragon", role: "tail" }).cell,
    "14-10",
  );
  assert.equal(
    originalTileVisual({ type: "carrot", phase: "consumed" }).cell,
    "13-10",
  );
  assert.equal(
    originalTileVisual({ type: "transparent" }).cell,
    "16-16",
  );
});

test("TS 与 TA 动画序列由同一目录提供", () => {
  assert.deepEqual(
    originalTileAnimation({ type: "plank", id: "crumbling" })
      .frames.map((frame) => `${frame.atlas}:${frame.cell}`),
    ["ts:14-6", "ts:14-7"],
  );
  assert.deepEqual(
    originalTileAnimation({
      type: "water",
      id: "ambient",
      fields: { variant: "ripple" },
    }).frames.map((frame) => `${frame.atlas}:${frame.cell}`),
    ["ta:10-4", "ta:11-1", "ta:11-2", "ta:11-3", "ta:11-4", "ta:12-1", "ta:12-2"],
  );
  assert.ok(ORIGINAL_TILE_ANIMATIONS.every((animation) => animation.frames.length > 0));
  const taCells = ORIGINAL_TILE_ANIMATIONS.flatMap((animation) =>
    animation.frames
      .filter((frame) => frame.atlas === "ta")
      .map((frame) => frame.cell)
  );
  assert.equal(taCells.length, 60);
  assert.equal(new Set(taCells).size, 60);
});
