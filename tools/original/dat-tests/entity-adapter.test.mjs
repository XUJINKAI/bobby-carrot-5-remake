import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  MapEntityTypeId,
} from "../../../model/dist/index.js";
import {
  adaptDecodedMap,
  adaptDecodedObject,
  adaptDecodedTerrain,
  mowedGroundAt,
} from "../entity-adapter.mjs";
import { reverseEntityMap } from "../entity-reverse-adapter.mjs";
import { DecodedObject, DecodedTerrain } from "../dat/semantic-ids.mjs";
import {
  decodeDatObject,
  decodeDatTerrain,
  encodeDatObject,
  encodeDatTerrain,
} from "../dat/mapping.mjs";

test("三色云朵停靠格通过 DAT object 往返并保留底层 terrain", () => {
  for (const [color, type] of [
    ["red", DecodedObject.CLOUD_GRID_RED],
    ["purple", DecodedObject.CLOUD_GRID_PURPLE],
    ["green", DecodedObject.CLOUD_GRID_GREEN],
  ]) {
    const source = {
      width: 2,
      height: 1,
      terrain: [[DecodedTerrain.START, DecodedTerrain.WATER]],
      objects: [{ type, x: 1, y: 0 }],
    };
    const map = adaptDecodedMap(source);
    assert.ok(map.entities.some((entity) =>
      entity.type === "cloud-parking" && entity.color === color
    ));
    const decoded = reverseEntityMap({
      schemaVersion: 1,
      width: source.width,
      height: source.height,
      ...map,
    });
    assert.deepEqual(decoded.terrain, source.terrain.map((row) =>
      row.map((terrain) => decodeDatTerrain(encodeDatTerrain(terrain)))
    ));
    assert.deepEqual(decoded.objects, [{
      type: decodeDatObject(encodeDatObject(type)),
      x: 1,
      y: 0,
    }]);
    assert.deepEqual(adaptDecodedMap(decoded), map);
  }
});

test("DAT Tide bytes use the confirmed runtime directions", () => {
  assert.equal(decodeDatTerrain(0x57), "ts-6-8:tide-down");
  assert.equal(decodeDatTerrain(0x58), "ts-6-9:tide-up");
  assert.equal(decodeDatTerrain(0x59), "ts-6-10:tide-right");
  assert.equal(decodeDatTerrain(0x5a), "ts-6-11:tide-left");
  assert.equal(encodeDatTerrain(DecodedTerrain.TIDE_DOWN), 0x57);
  assert.equal(encodeDatTerrain(DecodedTerrain.TIDE_LEFT), 0x5a);
});

test("DAT Start 保留普通地面，并在相同坐标生成 Bobby", () => {
  const result = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[
      decodeDatTerrain(0x5e),
      decodeDatTerrain(encodeDatTerrain(DecodedTerrain.START)),
    ]],
    objects: [],
  });
  assert.deepEqual(result.entities, [
    { type: MapEntityTypeId.GRASS, x: 0, y: 0, variant: "ts-6-15" },
    { type: EntityTypeId.START, x: 1, y: 0 },
    { type: EntityTypeId.BOBBY, x: 1, y: 0 },
  ]);
});

test("已稳定 terrain 字段折叠为 canonical flat fields", () => {
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.TIDE_LEFT, 1, 2), [
    { type: EntityTypeId.TIDE, x: 1, y: 2, direction: "left" },
  ]);
  assert.deepEqual(
    adaptDecodedTerrain(DecodedTerrain.SPEED_SWITCH_PRESSED, 1, 2),
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
    adaptDecodedTerrain(DecodedTerrain.SPEED_SWITCH_RAISED, 1, 2),
    [{ type: EntityTypeId.SPEED_SWITCH, x: 1, y: 2 }],
  );
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.WIND_SWITCH_2_OFF, 1, 2), [
    {
      type: EntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      direction: "left",
    },
  ]);
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.WIND_SWITCH_3_ON, 1, 2), [
    {
      type: EntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      direction: "right",
      active: true,
    },
  ]);
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.TRAP_ACTIVE, 1, 2), [
    { type: EntityTypeId.TRAP, x: 1, y: 2 },
  ]);
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.TRAP_INACTIVE, 1, 2), [
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
  assert.equal(
    reversed.terrain[0][1],
    decodeDatTerrain(encodeDatTerrain(DecodedTerrain.WIND_SWITCH_2_ON)),
  );
  assert.deepEqual(
    adaptDecodedMap(reversed).entities.find(
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

test("Mirror 数字帧与 Carousel 方向在 adapter 边界转换", () => {
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.MIRROR_4, 1, 2), [
    { type: EntityTypeId.MIRROR, x: 1, y: 2, variant: 4 },
  ]);
  assert.deepEqual(
    adaptDecodedTerrain(DecodedTerrain.CAROUSEL_2, 1, 2),
    [
      {
        type: EntityTypeId.CAROUSEL,
        x: 1,
        y: 2,
        variant: "left-top",
      },
    ],
  );
  assert.deepEqual(
    adaptDecodedTerrain(DecodedTerrain.CAROUSEL_HORIZONTAL, 1, 2),
    [
      {
        type: EntityTypeId.CAROUSEL,
        x: 1,
        y: 2,
        variant: "horizontal",
      },
    ],
  );
  assert.deepEqual(
    adaptDecodedTerrain(DecodedTerrain.COLOR_PINK_BLOCK_LOWERED, 1, 2),
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
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.SNOW, 3, 4), [
    { type: MapEntityTypeId.GRASS, x: 3, y: 4, variant: "ts-10-2" },
    { type: EntityTypeId.SNOW, x: 3, y: 4 },
  ]);
  assert.deepEqual(adaptDecodedTerrain(DecodedTerrain.HIGH_GRASS, 3, 4), [
    canonicalMowedGroundAt(3, 4),
    { type: EntityTypeId.HIGH_GRASS, x: 3, y: 4 },
  ]);
});

test("隐藏主目标在 Adapter 阶段 materialize 到草下，同格已有显式 Entity 时不重复生成", () => {
  const result = adaptDecodedMap({
    width: 3,
    height: 1,
    terrain: [[
      DecodedTerrain.START,
      DecodedTerrain.HIGH_GRASS_OBJECTIVE,
      DecodedTerrain.HIGH_GRASS_OBJECTIVE,
    ]],
    objects: [{ type: DecodedObject.CARROT, x: 2, y: 0 }],
  });
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 1 && entity.y === 0),
    [
      canonicalMowedGroundAt(1, 0),
      { type: EntityTypeId.CARROT, x: 1, y: 0 },
      { type: MapEntityTypeId.HIGH_GRASS, x: 1, y: 0 },
    ],
  );
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 2 && entity.y === 0),
    [
      canonicalMowedGroundAt(2, 0),
      { type: MapEntityTypeId.HIGH_GRASS, x: 2, y: 0 },
      { type: EntityTypeId.CARROT, x: 2, y: 0 },
    ],
  );
});

test("没有显式胡萝卜的原版地图把隐藏目标 materialize 为 Empty Nest", () => {
  const result = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[DecodedTerrain.START, DecodedTerrain.HIGH_GRASS_OBJECTIVE]],
    objects: [],
  });
  assert.ok(
    result.entities.some(
      (entity) =>
        entity.type === MapEntityTypeId.EGG_NEST &&
        entity.x === 1 &&
        entity.y === 0,
    ),
  );
});

test("旧 Object anchor/phase 映射到单一 canonical Entity", () => {
  assert.deepEqual(
    adaptDecodedObject({ type: DecodedObject.DRAGON_HEAD_BASE, x: 2, y: 3 }),
    [{ type: EntityTypeId.DRAGON, x: 3, y: 3, direction: "left" }],
  );
  assert.deepEqual(
    adaptDecodedObject({ type: DecodedObject.DRAGON_TAIL, x: 4, y: 3 }),
    [],
  );
  assert.deepEqual(
    adaptDecodedObject({ type: DecodedObject.ICE_MELT_2, x: 4, y: 3 }),
    [{ type: EntityTypeId.ICE_BLOCK, x: 4, y: 3 }],
  );
});

test("atlas-first Object 标签仍进入已知 canonical Entity 分支", () => {
  assert.deepEqual(
    adaptDecodedObject({ type: decodeDatObject(0xca), x: 2, y: 3 }),
    [{ type: MapEntityTypeId.CARROT, x: 2, y: 3 }],
  );
  assert.deepEqual(
    adaptDecodedObject({ type: decodeDatObject(0xd4), x: 2, y: 3 }),
    [{ type: MapEntityTypeId.PLANK, x: 2, y: 3 }],
  );
  assert.deepEqual(
    adaptDecodedObject({ type: decodeDatObject(0xde), x: 2, y: 3 }),
    [],
  );
});

test("原版已登记 Object byte 不会落入坐标型 fallback", () => {
  for (let byte = 0xc9; byte <= 0xff; byte += 1) {
    const entities = adaptDecodedObject({
      type: decodeDatObject(byte),
      x: 2,
      y: 3,
    });
    assert.equal(
      entities.some((entity) => /^object-\d+-\d+$/.test(entity.type)),
      false,
      `0x${byte.toString(16).toUpperCase()}`,
    );
  }
});

test("atlas-first Object 标签参与隐藏目标和空对象判定", () => {
  const carrotMap = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[DecodedTerrain.START, DecodedTerrain.HIGH_GRASS_OBJECTIVE]],
    objects: [
      { type: decodeDatObject(0xca), x: 0, y: 0 },
      { type: decodeDatObject(0xff), x: 1, y: 0 },
    ],
  });
  assert.ok(
    carrotMap.entities.some(
      (entity) =>
        entity.type === MapEntityTypeId.CARROT &&
        entity.x === 1 &&
        entity.y === 0,
    ),
  );
});

test("Dragon canonical body anchor round-trips to original head coordinate", () => {
  const baseEntities = [
    { type: "grass", x: 0, y: 0, variant: "ts-6-15" },
    { type: "grass", x: 1, y: 0, variant: "ts-6-15" },
    { type: "grass", x: 2, y: 0, variant: "ts-6-15" },
    { type: EntityTypeId.START, x: 3, y: 0 },
    { type: EntityTypeId.BOBBY, x: 3, y: 0, direction: "down" },
    { type: "grass", x: 4, y: 0, variant: "ts-6-15" },
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
      (object) =>
        object.type === decodeDatObject(
          encodeDatObject(DecodedObject.DRAGON_HEAD_BASE),
        ),
    ),
    [{
      type: decodeDatObject(encodeDatObject(DecodedObject.DRAGON_HEAD_BASE)),
      x: 1,
      y: 0,
    }],
  );
  assert.deepEqual(
    adaptDecodedMap(reversed).entities.find(
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
  for (const [index, type] of [
    DecodedObject.FENCE_1,
    DecodedObject.FENCE_2,
    DecodedObject.FENCE_3,
    DecodedObject.FENCE_4,
    DecodedObject.FENCE_5,
    DecodedObject.FENCE_6,
  ].entries()) {
    assert.deepEqual(adaptDecodedObject({ type, x: 4, y: 3 }), [
      {
        type: MapEntityTypeId.FENCE,
        x: 4,
        y: 3,
        variant: `ts-16-${index + 10}`,
      },
    ]);
  }
  assert.deepEqual(
    adaptDecodedObject({ type: "ts-16-14:fence", x: 4, y: 3 }),
    [
      {
        type: MapEntityTypeId.FENCE,
        x: 4,
        y: 3,
        variant: "ts-16-14",
      },
    ],
  );
});

test("DAT surface variant 转换为可追溯的稳定 Surface ABI", () => {
  assert.deepEqual(adaptDecodedTerrain("ts-7-1:grass", 0, 0), [
    { type: MapEntityTypeId.GRASS, x: 0, y: 0, variant: "ts-7-1" },
  ]);
  assert.deepEqual(adaptDecodedTerrain("ts-4-13:tree", 1, 0), [
    { type: MapEntityTypeId.TREE, x: 1, y: 0, variant: "ts-4-13" },
  ]);
  assert.throws(
    () => adaptDecodedObject({ type: "unknown-object", x: 0, y: 0 }),
    /Unsupported decoded object type/,
  );
});


test("拼图式 Surface 的每个 atlas 单元保持独立 canonical Entity", () => {
  const result = adaptDecodedMap({
    width: 3,
    height: 2,
    terrain: [
      ["ts-5-11:moon", "ts-5-12:moon", "ts-5-13:moon"],
      [
        decodeDatTerrain(encodeDatTerrain(DecodedTerrain.START)),
        decodeDatTerrain(0x5e),
        decodeDatTerrain(0x5e),
      ],
    ],
    objects: [],
  });
  assert.deepEqual(result.entities.filter((entity) => entity.type === MapEntityTypeId.MOON), [
    { type: MapEntityTypeId.MOON, x: 0, y: 0, variant: "ts-5-11" },
    { type: MapEntityTypeId.MOON, x: 1, y: 0, variant: "ts-5-12" },
    { type: MapEntityTypeId.MOON, x: 2, y: 0, variant: "ts-5-13" },
  ]);
});

function canonicalMowedGroundAt(x, y) {
  return { type: MapEntityTypeId.GRASS, x, y, variant: mowedGroundAt(x, y) };
}
