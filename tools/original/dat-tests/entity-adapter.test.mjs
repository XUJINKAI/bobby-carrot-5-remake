import test from "node:test";
import assert from "node:assert/strict";
import {
  MapEntityTypeId,
} from "../../../model/dist/index.js";
import {
  adaptDecodedMap,
  mowedGroundAt,
} from "../entity-adapter.mjs";
import { reverseEntityMap } from "../entity-reverse-adapter.mjs";
import {
  decodeDatObject,
  decodeDatTerrain,
  encodeDatObject,
  encodeDatTerrain,
} from "../dat/mapping.mjs";

const terrain = (byte) => decodeDatTerrain(byte);
const objectTile = (byte) => decodeDatObject(byte);

test("三色云朵停靠格通过 DAT object 往返并保留底层 terrain", () => {
  for (const [color, type] of [
    ["red", objectTile(0xf0)],
    ["purple", objectTile(0xf1)],
    ["green", objectTile(0xf2)],
  ]) {
    const source = {
      width: 2,
      height: 1,
      terrain: [[terrain(0x95), terrain(0x55)]],
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
  assert.equal(encodeDatTerrain(terrain(0x57)), 0x57);
  assert.equal(encodeDatTerrain(terrain(0x5a)), 0x5a);
});

test("DAT Start 保留普通地面，并在相同坐标生成 Bobby", () => {
  const result = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[
      decodeDatTerrain(0x5e),
      terrain(0x95),
    ]],
    objects: [],
  });
  assert.deepEqual(result.entities, [
    { type: MapEntityTypeId.GRASS, x: 0, y: 0, variant: "ts-6-15" },
    { type: MapEntityTypeId.START, x: 1, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
  ]);
});

test("已稳定 terrain 字段折叠为 canonical flat fields", () => {
  assert.deepEqual(adaptTerrainCell(terrain(0x5a), 1, 2), [
    { type: MapEntityTypeId.TIDE, x: 1, y: 2, direction: "left" },
  ]);
  assert.deepEqual(
    adaptTerrainCell(terrain(0xa1), 1, 2),
    [
      {
        type: MapEntityTypeId.SPEED_SWITCH,
        x: 1,
        y: 2,
        pressed: true,
      },
    ],
  );
  assert.deepEqual(
    adaptTerrainCell(terrain(0xa2), 1, 2),
    [{ type: MapEntityTypeId.SPEED_SWITCH, x: 1, y: 2 }],
  );
  assert.deepEqual(adaptTerrainCell(terrain(0xac), 1, 2), [
    {
      type: MapEntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      direction: "left",
    },
  ]);
  assert.deepEqual(adaptTerrainCell(terrain(0xad), 1, 2), [
    {
      type: MapEntityTypeId.WIND_SWITCH,
      x: 1,
      y: 2,
      direction: "right",
      active: true,
    },
  ]);
  assert.deepEqual(adaptTerrainCell(terrain(0xaf), 1, 2), [
    { type: MapEntityTypeId.TRAP, x: 1, y: 2 },
  ]);
  assert.deepEqual(adaptTerrainCell(terrain(0xb0), 1, 2), [
    { type: MapEntityTypeId.TRAP, x: 1, y: 2, active: false },
  ]);
});

test("Wind Switch DAT 数字只在 adapter 边界映射到 direction", () => {
  const reversed = reverseEntityMap({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.START, x: 0, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 1,
        y: 0,
        direction: "left",
        active: true,
      },
    ],
  });
  assert.equal(
    reversed.terrain[0][1],
    terrain(0xab),
  );
  assert.deepEqual(
    adaptDecodedMap(reversed).entities.find(
      (entity) => entity.type === MapEntityTypeId.WIND_SWITCH,
    ),
    {
      type: MapEntityTypeId.WIND_SWITCH,
      x: 1,
      y: 0,
      direction: "left",
      active: true,
    },
  );
});

test("Mirror 数字帧与 Carousel 方向在 adapter 边界转换", () => {
  assert.deepEqual(adaptTerrainCell(terrain(0xb1), 1, 2), [
    { type: MapEntityTypeId.MIRROR, x: 1, y: 2, variant: "right-bottom" },
  ]);
  assert.deepEqual(adaptTerrainCell(terrain(0xb4), 1, 2), [
    { type: MapEntityTypeId.MIRROR, x: 1, y: 2, variant: "left-top" },
  ]);
  assert.deepEqual(
    adaptTerrainCell(terrain(0xba), 1, 2),
    [
      {
        type: MapEntityTypeId.CAROUSEL,
        x: 1,
        y: 2,
        variant: "left-top",
      },
    ],
  );
  assert.deepEqual(
    adaptTerrainCell(terrain(0xbe), 1, 2),
    [
      {
        type: MapEntityTypeId.CAROUSEL,
        x: 1,
        y: 2,
        variant: "horizontal",
      },
    ],
  );
  assert.deepEqual(
    adaptTerrainCell(terrain(0xc6), 1, 2),
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

test("原版单层 Snow/High Grass 精确展开为 surface + cover", () => {
  assert.deepEqual(adaptTerrainCell(terrain(0x4d), 3, 4), [
    {
      type: MapEntityTypeId.SNOW_CLOUD,
      x: 3,
      y: 4,
      variant: "ts-8-13",
    },
    { type: MapEntityTypeId.SNOW, x: 3, y: 4 },
  ]);
  assert.deepEqual(adaptTerrainCell(terrain(0xc7), 3, 4), [
    canonicalMowedGroundAt(3, 4),
    { type: MapEntityTypeId.HIGH_GRASS, x: 3, y: 4 },
  ]);
});

test("隐藏主目标在 Adapter 阶段 materialize 到草下，同格已有显式 Entity 时不重复生成", () => {
  const result = adaptDecodedMap({
    width: 3,
    height: 1,
    terrain: [[
      terrain(0x95),
      terrain(0xc8),
      terrain(0xc8),
    ]],
    objects: [{ type: objectTile(0xca), x: 2, y: 0 }],
  });
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 1 && entity.y === 0),
    [
      canonicalMowedGroundAt(1, 0),
      { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
      { type: MapEntityTypeId.HIGH_GRASS, x: 1, y: 0 },
    ],
  );
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 2 && entity.y === 0),
    [
      canonicalMowedGroundAt(2, 0),
      { type: MapEntityTypeId.CARROT, x: 2, y: 0 },
      { type: MapEntityTypeId.HIGH_GRASS, x: 2, y: 0 },
    ],
  );
});

test("High Grass 上的显式 Bonus Coin 转换为 ground/content/cover 堆叠", () => {
  const result = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[terrain(0x95), terrain(0xc7)]],
    objects: [{ type: objectTile(0xf8), x: 1, y: 0 }],
  });
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 1 && entity.y === 0),
    [
      canonicalMowedGroundAt(1, 0),
      { type: MapEntityTypeId.BONUS_COIN, x: 1, y: 0 },
      { type: MapEntityTypeId.HIGH_GRASS, x: 1, y: 0 },
    ],
  );
});

test("Snow 上的显式 Bonus Coin 转换为 ground/content/cover 堆叠", () => {
  const result = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[terrain(0x95), terrain(0x4d)]],
    objects: [{ type: objectTile(0xf8), x: 1, y: 0 }],
  });
  assert.deepEqual(
    result.entities.filter((entity) => entity.x === 1 && entity.y === 0),
    [
      {
        type: MapEntityTypeId.SNOW_CLOUD,
        x: 1,
        y: 0,
        variant: "ts-8-13",
      },
      { type: MapEntityTypeId.BONUS_COIN, x: 1, y: 0 },
      { type: MapEntityTypeId.SNOW, x: 1, y: 0 },
    ],
  );
});

test("Patch 以 Snow 作为 terrain，并忽略同格底层 Surface", () => {
  const reversed = reverseEntityMap({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.START, x: 0, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      {
        type: MapEntityTypeId.SNOW_CLOUD,
        x: 1,
        y: 0,
        variant: "ts-8-13",
      },
      { type: MapEntityTypeId.BONUS_COIN, x: 1, y: 0 },
      { type: MapEntityTypeId.SNOW, x: 1, y: 0 },
    ],
  });
  assert.equal(reversed.terrain[0][1], terrain(0x4d));
  assert.deepEqual(reversed.objects, [
    { type: objectTile(0xf8), x: 1, y: 0 },
  ]);
});

test("没有显式胡萝卜的原版地图把隐藏目标 materialize 为 Empty Nest", () => {
  const result = adaptDecodedMap({
    width: 2,
    height: 1,
    terrain: [[terrain(0x95), terrain(0xc8)]],
    objects: [],
  });
  assert.ok(
    result.entities.some(
      (entity) =>
        entity.type === MapEntityTypeId.EGG &&
        entity.x === 1 &&
        entity.y === 0,
    ),
  );
});

test("原版 Object anchor/phase 映射到单一 canonical Entity", () => {
  assert.deepEqual(
    adaptObjectCell({ type: objectTile(0xd7), x: 2, y: 3 }),
    [{ type: MapEntityTypeId.DRAGON, x: 3, y: 3, direction: "left" }],
  );
  assert.deepEqual(
    adaptObjectCell({ type: objectTile(0xd9), x: 4, y: 3 }),
    [],
  );
  assert.deepEqual(
    adaptObjectCell({ type: objectTile(0xe5), x: 4, y: 3 }),
    [{ type: MapEntityTypeId.ICE_BLOCK, x: 4, y: 3 }],
  );
});

test("atlas-first Object 标签仍进入已知 canonical Entity 分支", () => {
  assert.deepEqual(
    adaptObjectCell({ type: decodeDatObject(0xca), x: 2, y: 3 }),
    [{ type: MapEntityTypeId.CARROT, x: 2, y: 3 }],
  );
  assert.deepEqual(
    adaptObjectCell({ type: decodeDatObject(0xd4), x: 2, y: 3 }),
    [{ type: MapEntityTypeId.PLANK, x: 2, y: 3 }],
  );
  assert.deepEqual(
    adaptObjectCell({ type: decodeDatObject(0xde), x: 2, y: 3 }),
    [],
  );
});

test("原版已登记 Object byte 不会落入坐标型 fallback", () => {
  for (let byte = 0xc9; byte <= 0xff; byte += 1) {
    const entities = adaptObjectCell({
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
    terrain: [[terrain(0x95), terrain(0xc8)]],
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
    { type: MapEntityTypeId.START, x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 3, y: 0 },
    { type: "grass", x: 4, y: 0, variant: "ts-6-15" },
  ];
  const map = {
    schemaVersion: 1,
    width: 5,
    height: 1,
    entities: [
      ...baseEntities,
      { type: MapEntityTypeId.DRAGON, x: 2, y: 0, direction: "left" },
    ],
  };
  const reversed = reverseEntityMap(map);
  assert.deepEqual(
    reversed.objects.filter(
      (object) =>
        object.type === decodeDatObject(
          encodeDatObject(objectTile(0xd7)),
        ),
    ),
    [{
      type: objectTile(0xd7),
      x: 1,
      y: 0,
    }],
  );
  assert.deepEqual(
    adaptDecodedMap(reversed).entities.find(
      (entity) => entity.type === MapEntityTypeId.DRAGON,
    ),
    { type: MapEntityTypeId.DRAGON, x: 2, y: 0, direction: "left" },
  );

  assert.throws(
    () =>
      reverseEntityMap({
        ...map,
        entities: map.entities.map((entity) =>
          entity.type === MapEntityTypeId.DRAGON
            ? { ...entity, direction: "right" }
            : entity,
        ),
      }),
    /Dragon 只支持 left direction/,
  );
});

test("两格角色以 canonical body anchor 往返原版 head 坐标", () => {
  for (const [type, headByte] of [
    [MapEntityTypeId.SANDMAN, 0xda],
    [MapEntityTypeId.DREAM_MACHINE, 0xdb],
    [MapEntityTypeId.BEAVER, 0xe7],
  ]) {
    const map = {
      schemaVersion: 1,
      width: 3,
      height: 2,
      entities: [
        { type: "grass", x: 0, y: 0, variant: "ts-6-15" },
        { type: "grass", x: 1, y: 0, variant: "ts-6-15" },
        { type: MapEntityTypeId.START, x: 2, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 2, y: 0 },
        { type: "grass", x: 0, y: 1, variant: "ts-6-15" },
        { type: "grass", x: 1, y: 1, variant: "ts-6-15" },
        { type: "grass", x: 2, y: 1, variant: "ts-6-15" },
        { type, x: 1, y: 1 },
      ],
    };
    const reversed = reverseEntityMap(map);
    assert.deepEqual(reversed.objects, [
      { type: objectTile(headByte), x: 1, y: 0 },
    ]);
    assert.deepEqual(
      adaptDecodedMap(reversed).entities.find(
        (entity) => entity.type === type,
      ),
      { type, x: 1, y: 1 },
    );
  }
});

test("六种 DAT Fence 形态全部折叠为一个 canonical Fence", () => {
  for (const [index, type] of [
    objectTile(0xf9),
    objectTile(0xfa),
    objectTile(0xfb),
    objectTile(0xfc),
    objectTile(0xfd),
    objectTile(0xfe),
  ].entries()) {
    assert.deepEqual(adaptObjectCell({ type, x: 4, y: 3 }), [
      {
        type: MapEntityTypeId.FENCE,
        x: 4,
        y: 3,
        variant: `ts-16-${index + 10}`,
      },
    ]);
  }
  assert.deepEqual(
    adaptObjectCell({ type: "ts-16-14:fence", x: 4, y: 3 }),
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
  assert.deepEqual(adaptTerrainCell("ts-7-1:grass", 0, 0), [
    { type: MapEntityTypeId.GRASS, x: 0, y: 0, variant: "ts-7-1" },
  ]);
  assert.deepEqual(adaptTerrainCell("ts-4-13:tree", 1, 0), [
    { type: MapEntityTypeId.TREE, x: 1, y: 0, variant: "ts-4-13" },
  ]);
  assert.throws(
    () => adaptObjectCell({ type: "unknown-object", x: 0, y: 0 }),
    /Unsupported decoded object/,
  );
});


test("拼图式 Surface 的每个 atlas 单元保持独立 canonical Entity", () => {
  const result = adaptDecodedMap({
    width: 3,
    height: 2,
    terrain: [
      ["ts-5-11:moon", "ts-5-12:moon", "ts-5-13:moon"],
      [
        terrain(0x95),
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

/** 通过整图入口观察指定 terrain cell 的转换结果。 */
function adaptTerrainCell(type, x, y) {
  const width = x + 2;
  const height = y + 1;
  const terrainRows = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => terrain(0x5e))
  );
  terrainRows[y][x] = type;
  terrainRows[0][x + 1] = terrain(0x95);

  return adaptDecodedMap({
    width,
    height,
    terrain: terrainRows,
    objects: [],
  }).entities.filter((entity) => entity.x === x && entity.y === y);
}

/** 通过整图入口扣除基础 terrain，得到指定 object 对 Cell Stack 的贡献。 */
function adaptObjectCell(object) {
  const width = object.x + 2;
  const height = object.y + 1;
  const terrainRows = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => terrain(0x5e))
  );
  terrainRows[0][object.x + 1] = terrain(0x95);
  const source = {
    width,
    height,
    terrain: terrainRows,
    objects: [],
  };
  const baselineCounts = new Map();
  for (const entity of adaptDecodedMap(source).entities) {
    const key = JSON.stringify(entity);
    baselineCounts.set(key, (baselineCounts.get(key) ?? 0) + 1);
  }

  return adaptDecodedMap({ ...source, objects: [object] }).entities.filter(
    (entity) => {
      const key = JSON.stringify(entity);
      const count = baselineCounts.get(key) ?? 0;
      if (count === 0) return true;
      baselineCounts.set(key, count - 1);
      return false;
    },
  );
}

function canonicalMowedGroundAt(x, y) {
  return { type: MapEntityTypeId.GRASS, x, y, variant: mowedGroundAt(x, y) };
}
