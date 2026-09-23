import assert from "node:assert/strict";
import test from "node:test";
import { parseMapDocument } from "@bobby/model";
import { convertRobo2Level } from "../../../tools/custom/robo2/convert.mjs";
import {
  decodeRobo2LevelRecord,
  ROBO2_TILE_CODE,
} from "../../../tools/custom/robo2/format.mjs";

test("Robo 2 第一关按模拟器坐标和炮口方向转换", () => {
  const decoded = decodeRobo2LevelRecord(
    Buffer.from("0606031111111008011000b127000110a001111111", "hex"),
    "data/0",
  );
  const document = convertRobo2Level(decoded, {
    id: "01",
    title: "The beggining!",
  });
  const objects = document.entities
    .filter((entity) => entity.stackOrder === 1)
    .map(({ type, x, y, direction }) => ({
      type,
      x,
      y,
      ...(direction ? { direction } : {}),
    }));

  assert.deepEqual(objects, [
    { type: "exit", x: 3, y: 0 },
    { type: "laser-cannon", x: 3, y: 1, direction: "down" },
    { type: "laser-cannon", x: 4, y: 2, direction: "left" },
    { type: "laser-cannon", x: 1, y: 3, direction: "right" },
    { type: "bobby", x: 2, y: 4 },
  ]);
});

test("Robo 2 tile 转换为可校验的语义 Entity", () => {
  const tiles = [
    ROBO2_TILE_CODE.FLOOR,
    ROBO2_TILE_CODE.WALL,
    ROBO2_TILE_CODE.EXIT,
    ROBO2_TILE_CODE.STONE,
    ROBO2_TILE_CODE.BOMB,
    ROBO2_TILE_CODE.MIRROR_LEFT,
    ROBO2_TILE_CODE.MIRROR_RIGHT,
    ROBO2_TILE_CODE.LASER_DOWN,
    ROBO2_TILE_CODE.LASER_RIGHT,
    ROBO2_TILE_CODE.LASER_UP,
    ROBO2_TILE_CODE.LASER_LEFT,
    ROBO2_TILE_CODE.PLAYER,
  ];
  const document = parseMapDocument(convertRobo2Level({
    width: 4,
    height: 3,
    theme: 3,
    tiles,
  }, {
    id: "01",
    title: "The beggining!",
  }));

  assert.equal(document.meta.name, "01 · The beggining!");
  assert.equal(document.width, 4);
  assert.equal(document.height, 3);
  assert.equal(document.entities.length, 22);
  assert.deepEqual(document.rules, {
    win: { type: "all", conditions: [{ type: "exit" }] },
  });
  assert.deepEqual(entityAt(document, "stump", 1, 0), {
    type: "stump",
    x: 1,
    y: 0,
  });
  assert.deepEqual(entityAt(document, "laser-mirror", 1, 1), {
    type: "laser-mirror",
    variant: "backslash",
    x: 1,
    y: 1,
    stackOrder: 1,
  });
  assert.equal(entityAt(document, "laser-stone", 3, 0).type, "laser-stone");
  assert.equal(entityAt(document, "laser-mirror", 2, 1).variant, "slash");
  assert.equal(entityAt(document, "laser-cannon", 3, 1).direction, "down");
  assert.equal(entityAt(document, "laser-cannon", 0, 2).direction, "right");
  assert.equal(entityAt(document, "laser-cannon", 1, 2).direction, "up");
  assert.equal(entityAt(document, "laser-cannon", 2, 2).direction, "left");
});

test("Robo 2 theme 只改变 Surface 映射", () => {
  const surfaces = [0, 1, 2, 3].map((theme) => {
    const document = convertRobo2Level({
      width: 3,
      height: 1,
      theme,
      tiles: [
        ROBO2_TILE_CODE.PLAYER,
        ROBO2_TILE_CODE.WALL,
        ROBO2_TILE_CODE.EXIT,
      ],
    }, {
      id: `theme-${theme}`,
      title: `Theme ${theme}`,
    });
    return document.entities.filter((entity) => entity.stackOrder !== 1);
  });

  assert.deepEqual(surfaces.map((entities) => entities.map(({ x, y, ...entity }) => entity)), [
    [
      { type: "snow-cloud", variant: "ts-8-16" },
      { type: "snowy-rock" },
      { type: "snow-cloud", variant: "ts-8-16" },
    ],
    [
      { type: "snow-cloud", variant: "ts-8-16" },
      { type: "snowy-rock" },
      { type: "snow-cloud", variant: "ts-8-16" },
    ],
    [
      { type: "sand" },
      { type: "cactus", variant: "small" },
      { type: "sand" },
    ],
    [
      { type: "grass", variant: "ts-10-1" },
      { type: "stump" },
      { type: "grass", variant: "ts-10-1" },
    ],
  ]);
});

test("Robo 2 沙地墙面按坐标稳定选取视觉", () => {
  const tiles = [
    ROBO2_TILE_CODE.PLAYER,
    ...Array.from({ length: 998 }, () => ROBO2_TILE_CODE.WALL),
    ROBO2_TILE_CODE.EXIT,
  ];
  const sand = convertRobo2Level({
    width: 100,
    height: 10,
    theme: 2,
    tiles,
  }, {
    id: "sand-distribution",
    title: "Sand Distribution",
  });
  const repeatedSand = convertRobo2Level({
    width: 100,
    height: 10,
    theme: 2,
    tiles,
  }, {
    id: "sand-distribution",
    title: "Sand Distribution",
  });
  assert.deepEqual(repeatedSand, sand);

  const cactusCounts = countVariants(sand, "cactus");
  assert.deepEqual(
    new Set(cactusCounts.keys()),
    new Set(["small", "round"]),
  );
  assert.ok((cactusCounts.get("small") ?? 0) > 400);
  assert.ok((cactusCounts.get("round") ?? 0) > 400);
});

test("Robo 2 转换要求唯一玩家与终点", () => {
  assert.throws(
    () => convertRobo2Level({
      width: 2,
      height: 1,
      theme: 0,
      tiles: [ROBO2_TILE_CODE.PLAYER, ROBO2_TILE_CODE.FLOOR],
    }, {
      id: "broken",
      title: "Broken",
    }),
    /exit 应恰好出现一次/,
  );
});

function entityAt(document, type, x, y) {
  const entity = document.entities.find((candidate) =>
    candidate.type === type && candidate.x === x && candidate.y === y
  );
  assert.ok(entity, `缺少 ${type} (${x}, ${y})`);
  return entity;
}

function countVariants(document, type) {
  const counts = new Map();
  for (const entity of document.entities.filter((candidate) =>
    candidate.type === type
  )) {
    counts.set(entity.variant, (counts.get(entity.variant) ?? 0) + 1);
  }
  return counts;
}
