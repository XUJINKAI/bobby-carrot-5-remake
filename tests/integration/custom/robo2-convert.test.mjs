import assert from "node:assert/strict";
import test from "node:test";
import { parseMapDocument } from "@bobby/model";
import { convertRobo2Level } from "../../../tools/custom/robo2/convert.mjs";
import { ROBO2_TILE_CODE } from "../../../tools/custom/robo2/format.mjs";

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
    ROBO2_TILE_CODE.LASER_UP,
    ROBO2_TILE_CODE.LASER_LEFT,
    ROBO2_TILE_CODE.LASER_RIGHT,
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
  assert.deepEqual(entityAt(document, "hedge", 1, 0), {
    type: "hedge",
    variant: "ts-5-7",
    x: 1,
    y: 0,
  });
  assert.deepEqual(entityAt(document, "laser-mirror", 1, 1), {
    type: "laser-mirror",
    variant: "slash",
    x: 1,
    y: 1,
    stackOrder: 1,
  });
  assert.equal(entityAt(document, "laser-mirror", 2, 1).variant, "backslash");
  assert.equal(entityAt(document, "laser-emitter", 3, 1).direction, "down");
  assert.equal(entityAt(document, "laser-emitter", 0, 2).direction, "up");
  assert.equal(entityAt(document, "laser-emitter", 1, 2).direction, "left");
  assert.equal(entityAt(document, "laser-emitter", 2, 2).direction, "right");
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

  assert.deepEqual(surfaces.map((entities) => entities.map((entity) => entity.type)), [
    ["sand", "stone-wall", "sand"],
    ["snow-cloud", "snowy-rock", "snow-cloud"],
    ["sand", "stone-wall", "sand"],
    ["grass", "hedge", "grass"],
  ]);
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
