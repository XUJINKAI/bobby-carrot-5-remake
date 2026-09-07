import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  MapEntityTypeId,
  legacyEntityMapAlias,
} from "../../../model/dist/index.js";
import {
  adaptLegacyMap,
  adaptLegacyObject,
  adaptLegacyTerrain,
  mowedGroundAt,
} from "../entity-adapter.mjs";
import { reverseEntityMap } from "../entity-reverse-adapter.mjs";
import { LegacyObject, LegacyTerrain } from "../dat/semantic-ids.mjs";
import { decodeDatTerrain, encodeDatTerrain } from "../dat/mapping.mjs";

test("DAT Tide bytes use the confirmed runtime directions", () => {
  assert.equal(decodeDatTerrain(0x57), LegacyTerrain.TIDE_DOWN);
  assert.equal(decodeDatTerrain(0x58), LegacyTerrain.TIDE_UP);
  assert.equal(decodeDatTerrain(0x59), LegacyTerrain.TIDE_RIGHT);
  assert.equal(decodeDatTerrain(0x5a), LegacyTerrain.TIDE_LEFT);
  assert.equal(encodeDatTerrain(LegacyTerrain.TIDE_DOWN), 0x57);
  assert.equal(encodeDatTerrain(LegacyTerrain.TIDE_LEFT), 0x5a);
});

test("DAT Start 保留普通地面，并在相同坐标生成 Bobby", () => {
  const result = adaptLegacyMap({
    width: 2,
    height: 1,
    terrain: [[LegacyTerrain.GROUND_A, LegacyTerrain.START]],
    objects: [],
  });
  assert.deepEqual(result.entities, [
    { type: MapEntityTypeId.GRASS, x: 0, y: 0, variant: "ts-6-15" },
    { type: EntityTypeId.START, x: 1, y: 0 },
    { type: EntityTypeId.BOBBY, x: 1, y: 0, direction: "down" },
  ]);
});

test("已稳定 terrain 字段折叠为 canonical flat fields", () => {
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.TIDE_LEFT, 1, 2), [
    { type: EntityTypeId.TIDE, x: 1, y: 2, direction: "left" },
  ]);
  assert.deepEqual(
    adaptLegacyTerrain(LegacyTerrain.SPEED_SWITCH_PRESSED, 1, 2),
    [
      {
        type: EntityTypeId.SPEED_SWITCH,
        x: 1,
        y: 2,
        pressed: true,
      },
    ],
  );
  assert.deepEqual(
    adaptLegacyTerrain(LegacyTerrain.SPEED_SWITCH_RAISED, 1, 2),
    [{ type: EntityTypeId.SPEED_SWITCH, x: 1, y: 2 }],
  );
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.WIND_SWITCH_2_OFF, 1, 2), [
    {
      type: EntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      direction: "left",
    },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.WIND_SWITCH_3_ON, 1, 2), [
    {
      type: EntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      direction: "right",
      active: true,
    },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.TRAP_ACTIVE, 1, 2), [
    { type: EntityTypeId.TRAP, x: 1, y: 2 },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.TRAP_INACTIVE, 1, 2), [
    { type: EntityTypeId.TRAP, x: 1, y: 2, active: false },
  ]);
});

test("Wind Switch DAT 数字只在 adapter 边界映射到 direction", () => {
  const reversed = reverseEntityMap({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.START, x: 0, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "down" },
      {
        type: EntityTypeId.WIND_SWITCH,
        x: 1,
        y: 0,
        direction: "left",
        active: true,
      },
    ],
  });
  assert.equal(reversed.terrain[0][1], LegacyTerrain.WIND_SWITCH_2_ON);
  assert.deepEqual(
    adaptLegacyMap(reversed).entities.find(
      (entity) => entity.type === EntityTypeId.WIND_SWITCH,
    ),
    {
      type: EntityTypeId.WIND_SWITCH,
      x: 1,
      y: 0,
      direction: "left",
      active: true,
    },
  );
});

test("未确认的 Mirror/Carousel 语义保持在 adapter 隔离层", () => {
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.MIRROR_4, 1, 2), [
    { type: EntityTypeId.MIRROR, x: 1, y: 2, state: { variant: 4 } },
  ]);
  assert.deepEqual(
    adaptLegacyTerrain(LegacyTerrain.CAROUSEL_HORIZONTAL, 1, 2),
    [
      {
        type: EntityTypeId.CAROUSEL,
        x: 1,
        y: 2,
        state: { variant: "horizontal" },
      },
    ],
  );
  assert.deepEqual(
    adaptLegacyTerrain(LegacyTerrain.COLOR_PINK_BLOCK_LOWERED, 1, 2),
    [
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 1,
        y: 2,
        color: "pink",
        raised: false,
      },
    ],
  );
});

test("旧单层 Snow/High Grass 精确展开为 surface + cover", () => {
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.SNOW, 3, 4), [
    { type: MapEntityTypeId.GRASS, x: 3, y: 4, variant: "ts-10-2" },
    { type: EntityTypeId.SNOW, x: 3, y: 4 },
  ]);
  assert.deepEqual(adaptLegacyTerrain(LegacyTerrain.HIGH_GRASS, 3, 4), [
    canonicalMowedGroundAt(3, 4),
    { type: EntityTypeId.HIGH_GRASS, x: 3, y: 4 },
  ]);
});

test("隐藏主目标在 Adapter 阶段 materialize 到草下，同格已有显式 Entity 时不重复生成", () => {
  const result = adaptLegacyMap({
    width: 3,
    height: 1,
    terrain: [[
      LegacyTerrain.START,
      LegacyTerrain.HIGH_GRASS_OBJECTIVE,
      LegacyTerrain.HIGH_GRASS_OBJECTIVE,
    ]],
    objects: [{ type: LegacyObject.CARROT, x: 2, y: 0 }],
  });
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 1 && entity.y === 0),
    [
      canonicalMowedGroundAt(1, 0),
      { type: EntityTypeId.CARROT, x: 1, y: 0 },
      { type: EntityTypeId.HIGH_GRASS_OBJECTIVE, x: 1, y: 0 },
    ],
  );
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 2 && entity.y === 0),
    [
      canonicalMowedGroundAt(2, 0),
      { type: EntityTypeId.HIGH_GRASS_OBJECTIVE, x: 2, y: 0 },
      { type: EntityTypeId.CARROT, x: 2, y: 0 },
    ],
  );
});

test("没有显式胡萝卜的原版地图把隐藏目标 materialize 为 Empty Nest", () => {
  const result = adaptLegacyMap({
    width: 2,
    height: 1,
    terrain: [[LegacyTerrain.START, LegacyTerrain.HIGH_GRASS_OBJECTIVE]],
    objects: [],
  });
  assert.ok(
    result.entities.some(
      (entity) =>
        entity.type === EntityTypeId.EGG_NEST_EMPTY &&
        entity.x === 1 &&
        entity.y === 0,
    ),
  );
});

test("旧 Object anchor/phase 映射到单一 canonical Entity", () => {
  assert.deepEqual(
    adaptLegacyObject({ type: LegacyObject.DRAGON_HEAD_BASE, x: 2, y: 3 }),
    [{ type: EntityTypeId.DRAGON, x: 3, y: 3, direction: "left" }],
  );
  assert.deepEqual(
    adaptLegacyObject({ type: LegacyObject.DRAGON_TAIL, x: 4, y: 3 }),
    [],
  );
  assert.deepEqual(
    adaptLegacyObject({ type: LegacyObject.ICE_MELT_2, x: 4, y: 3 }),
    [
      {
        type: EntityTypeId.ICE_BLOCK,
        x: 4,
        y: 3,
        state: { meltStage: 2 },
      },
    ],
  );
});

test("Dragon canonical body anchor round-trips to original head coordinate", () => {
  const baseEntities = [
    { type: EntityTypeId.GROUND_A, x: 0, y: 0 },
    { type: EntityTypeId.GROUND_A, x: 1, y: 0 },
    { type: EntityTypeId.GROUND_A, x: 2, y: 0 },
    { type: EntityTypeId.START, x: 3, y: 0 },
    { type: EntityTypeId.BOBBY, x: 3, y: 0, direction: "down" },
    { type: EntityTypeId.GROUND_A, x: 4, y: 0 },
  ];
  const map = {
    schemaVersion: 1,
    width: 5,
    height: 1,
    entities: [
      ...baseEntities,
      { type: EntityTypeId.DRAGON, x: 2, y: 0, direction: "left" },
    ],
  };
  const reversed = reverseEntityMap(map);
  assert.deepEqual(
    reversed.objects.filter(
      (object) => object.type === LegacyObject.DRAGON_HEAD_BASE,
    ),
    [{ type: LegacyObject.DRAGON_HEAD_BASE, x: 1, y: 0 }],
  );
  assert.deepEqual(
    adaptLegacyMap(reversed).entities.find(
      (entity) => entity.type === EntityTypeId.DRAGON,
    ),
    { type: EntityTypeId.DRAGON, x: 2, y: 0, direction: "left" },
  );

  assert.throws(
    () =>
      reverseEntityMap({
        ...map,
        entities: map.entities.map((entity) =>
          entity.type === EntityTypeId.DRAGON
            ? { ...entity, direction: "right" }
            : entity,
        ),
      }),
    /Dragon 只支持 left direction/,
  );
});

test("六种 DAT Fence 形态全部折叠为一个 canonical Fence", () => {
  for (const type of [
    LegacyObject.FENCE_1,
    LegacyObject.FENCE_2,
    LegacyObject.FENCE_3,
    LegacyObject.FENCE_4,
    LegacyObject.FENCE_5,
    LegacyObject.FENCE_6,
  ]) {
    assert.deepEqual(adaptLegacyObject({ type, x: 4, y: 3 }), [
      { type: EntityTypeId.FENCE, x: 4, y: 3 },
    ]);
  }
});

test("DAT surface variant 转换为可追溯的稳定 Surface ABI", () => {
  assert.deepEqual(adaptLegacyTerrain("walkable-variant-01", 0, 0), [
    { type: MapEntityTypeId.GRASS, x: 0, y: 0, variant: "ts-7-1" },
  ]);
  assert.deepEqual(
    adaptLegacyObject({ type: "object-variant-001", x: 0, y: 0 }),
    [{ type: "object-variant-001", x: 0, y: 0 }],
  );
});

function canonicalMowedGroundAt(x, y) {
  const alias = legacyEntityMapAlias(mowedGroundAt(x, y));
  assert.ok(alias?.to);
  return { type: alias.to, x, y, ...(alias.fields ?? {}) };
}
