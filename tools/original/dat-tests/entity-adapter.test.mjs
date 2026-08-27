import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "../../../model/dist/index.js";
import {
  adaptLegacyMap,
  adaptLegacyObject,
  adaptLegacyTerrain,
  mowedGroundAt,
} from "../entity-adapter.mjs";
import { LegacyObject, LegacyTerrain } from "../dat/semantic-ids.mjs";

test("DAT Start 保留普通地面，并在相同坐标生成 Bobby", () => {
  const result = adaptLegacyMap({
    width: 2,
    height: 1,
    terrain: [[LegacyTerrain.GROUND_A, LegacyTerrain.START]],
    objects: [],
  });
  assert.deepEqual(result.entities, [
    { type: EntityTypeId.GROUND_A, x: 0, y: 0 },
    { type: EntityTypeId.START, x: 1, y: 0 },
    { type: EntityTypeId.BOBBY, x: 1, y: 0, direction: "down" },
  ]);
});

test("旧 terrain 状态 ID 折叠到 canonical direction/state/property", () => {
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.TIDE_LEFT, 1, 2), [
    { type: EntityTypeId.TIDE, x: 1, y: 2, direction: "left" },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.SPEED_SWITCH_PRESSED, 1, 2), [
    { type: EntityTypeId.SPEED_SWITCH, x: 1, y: 2, state: { pressed: true } },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.WIND_SWITCH_2_OFF, 1, 2), [
    {
      type: EntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      properties: { channel: 2 },
      state: { active: false },
    },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.MIRROR_4, 1, 2), [
    { type: EntityTypeId.MIRROR, x: 1, y: 2, state: { variant: 4 } },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.CAROUSEL_HORIZONTAL, 1, 2), [
    {
      type: EntityTypeId.CAROUSEL,
      x: 1,
      y: 2,
      state: { variant: "horizontal" },
    },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.COLOR_PINK_BLOCK_LOWERED, 1, 2), [
    {
      type: EntityTypeId.COLOR_PINK_BLOCK,
      x: 1,
      y: 2,
      state: { raised: false },
    },
  ]);
});

test("旧单层 Snow/High Grass 精确展开为 surface + cover", () => {
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.SNOW, 3, 4), [
    { type: EntityTypeId.GROUND_D, x: 3, y: 4 },
    { type: EntityTypeId.SNOW, x: 3, y: 4 },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.HIGH_GRASS, 3, 4), [
    { type: mowedGroundAt(3, 4), x: 3, y: 4 },
    { type: EntityTypeId.HIGH_GRASS, x: 3, y: 4 },
  ]);
});

test("旧 Object anchor/phase 映射到单一 canonical Entity", () => {
  assert.deepEqual(
    adaptLegacyObject({ type: LegacyObject.DRAGON_HEAD_BASE, x: 2, y: 3 }),
    [{ type: EntityTypeId.DRAGON, x: 2, y: 3 }],
  );
  assert.deepEqual(
    adaptLegacyObject({ type: LegacyObject.DRAGON_TAIL, x: 4, y: 3 }),
    [],
  );
  assert.deepEqual(
    adaptLegacyObject({ type: LegacyObject.ICE_MELT_2, x: 4, y: 3 }),
    [{
      type: EntityTypeId.ICE_BLOCK,
      x: 4,
      y: 3,
      state: { meltStage: 2 },
    }],
  );
});

test("未命名 DAT semantic variant 保持稳定 EntityType", () => {
  assert.deepEqual(adaptLegacyTerrain("walkable-variant-01", 0, 0), [
    { type: "walkable-variant-01", x: 0, y: 0 },
  ]);
  assert.deepEqual(adaptLegacyObject({ type: "object-variant-001", x: 0, y: 0 }), [
    { type: "object-variant-001", x: 0, y: 0 },
  ]);
});
