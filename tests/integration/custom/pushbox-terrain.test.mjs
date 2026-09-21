import assert from "node:assert/strict";
import test from "node:test";
import { createPushboxTerrainPicker } from "../../../tools/custom/pushbox-terrain.mjs";
import { convertXsbBoard } from "../../../tools/custom/sokoban-xsb.mjs";

test("Pushbox 每张地图固定选一个主题，各类素材随主题保持一致", () => {
  const table = {
    theme1: {
      ground: ["ts-10-1", "ts-10-2"],
      boundary: ["rock"],
      obstacle: ["stump"],
    },
    theme2: {
      ground: ["ts-6-15", "ts-6-16"],
      boundary: ["stump"],
      obstacle: ["rock"],
    },
  };
  const pickedThemes = new Set();
  for (let map = 1; map <= 30; map += 1) {
    const mapKey = `test/${map}`;
    const pick = createPushboxTerrainPicker(mapKey, table, "terrain-test");
    const repeat = createPushboxTerrainPicker(mapKey, table, "terrain-test");
    const tiles = Array.from({ length: 20 }, (_, x) => pick("ground", x, 2));
    const variants = new Set(tiles.map((tile) => tile.variant));
    const firstGroup = new Set(table.theme1.ground);
    const secondGroup = new Set(table.theme2.ground);
    assert.ok(
      [...variants].every((variant) => firstGroup.has(variant)) ||
      [...variants].every((variant) => secondGroup.has(variant)),
      mapKey,
    );
    assert.deepEqual(tiles, Array.from({ length: 20 }, (_, x) => repeat("ground", x, 2)));
    const theme = firstGroup.has(tiles[0].variant) ? "theme1" : "theme2";
    assert.equal(pick("boundary", 0, 0).type, table[theme].boundary[0]);
    assert.equal(pick("obstacle", 1, 1).type, table[theme].obstacle[0]);
    pickedThemes.add(theme);
  }
  assert.deepEqual(pickedThemes, new Set(["theme1", "theme2"]));
});

test("Pushbox 将外沿归为矩形边界，其余墙归为内部阻挡", () => {
  const board = [
    "#########",
    "# *     #",
    "#  ###  #",
    "#  #$#  #",
    "#  #.#  #",
    "#  #@#  #",
    "#  ###  #",
    "#       #",
    "#########",
  ];
  const level = convertXsbBoard(board, "地形分类测试", {
    mapKey: "test/classification",
  });
  const terrain = createPushboxTerrainPicker("test/classification");
  const at = (x, y) => level.entities.filter((entity) =>
    entity.x === x && entity.y === y
  );

  assert.deepEqual(at(0, 0), [terrain("boundary", 0, 0)]);
  assert.deepEqual(at(4, 2), [terrain("obstacle", 4, 2)]);
  assert.deepEqual(at(1, 1), [terrain("ground", 1, 1)]);
  assert.deepEqual(at(4, 3), [
    terrain("ground", 4, 3),
    { type: "pushable-box", x: 4, y: 3, stackOrder: 2 },
  ]);
  assert.deepEqual(at(4, 4), [
    terrain("ground", 4, 4),
    { type: "push-goal", x: 4, y: 4, stackOrder: 1 },
  ]);
  assert.deepEqual(at(4, 5), [
    terrain("ground", 4, 5),
    { type: "bobby", x: 4, y: 5, stackOrder: 2 },
  ]);
  assert.deepEqual(at(2, 1), [
    terrain("ground", 2, 1),
    { type: "push-goal", x: 2, y: 1, stackOrder: 1 },
    { type: "pushable-box", x: 2, y: 1, stackOrder: 2 },
  ]);
  assert.equal(
    level.entities.filter((entity) => entity.type === "pushable-box").length,
    2,
  );
  assert.equal(
    level.entities.filter((entity) => entity.type === "push-goal").length,
    2,
  );
});

test("Pushbox 不规则 XSB 外轮廓生成完整矩形边框", () => {
  const board = [
    "  #####",
    "  #   #",
    "### .$#",
    "#  @  #",
    "#######",
  ];
  const mapKey = "test/rectangular-boundary";
  const level = convertXsbBoard(board, "矩形边框测试", { mapKey });
  const terrain = createPushboxTerrainPicker(mapKey);

  assert.equal(level.width, 7);
  assert.equal(level.height, 5);
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (x !== 0 && y !== 0 && x !== level.width - 1 && y !== level.height - 1) {
        continue;
      }
      assert.deepEqual(
        level.entities.find((entity) => entity.x === x && entity.y === y),
        terrain("boundary", x, y),
      );
    }
  }
  assert.deepEqual(
    level.entities.find((entity) => entity.x === 1 && entity.y === 1),
    terrain("obstacle", 1, 1),
  );
  assert.deepEqual(
    level.entities.find((entity) => entity.x === 2 && entity.y === 1),
    terrain("obstacle", 2, 1),
  );
  assert.equal(
    level.entities.some((entity) =>
      entity.type === "pushable-box" && entity.x === 5 && entity.y === 2
    ),
    true,
  );
  assert.equal(
    level.entities.some((entity) =>
      entity.type === "push-goal" && entity.x === 4 && entity.y === 2
    ),
    true,
  );
});

test("Pushbox 地形表拒绝空素材组和未登记的素材", () => {
  const base = {
    theme1: {
      ground: ["ts-10-1"],
      boundary: ["ts-4-6"],
      obstacle: ["ts-4-6"],
    },
  };
  assert.throws(
    () => createPushboxTerrainPicker("test/invalid", {
      theme1: { ...base.theme1, ground: [] },
    }),
    /theme1.ground 至少需要一个素材/,
  );
  assert.throws(
    () => createPushboxTerrainPicker("test/invalid", {
      theme1: { ...base.theme1, obstacle: ["ts-99-99"] },
    }),
    /未知地形素材/,
  );
});

test("Pushbox 地形表接受单一 Surface 名称，多形态素材要求具体坐标", () => {
  const pick = createPushboxTerrainPicker("test/names", {
    theme1: {
      ground: ["sand"],
      boundary: ["stump"],
      obstacle: ["rock"],
    },
  });
  assert.deepEqual(pick("ground", 1, 2), { type: "sand", x: 1, y: 2 });
  assert.deepEqual(pick("boundary", 3, 4), { type: "stump", x: 3, y: 4 });
  assert.deepEqual(pick("obstacle", 5, 6), { type: "rock", x: 5, y: 6 });

  assert.throws(
    () => createPushboxTerrainPicker("test/ambiguous", {
      theme1: {
        ground: ["grass"],
        boundary: ["stump"],
        obstacle: ["rock"],
      },
    }),
    /grass 有多个形态，请填写具体 ts-行-列/,
  );
});

test("Pushbox 主题键仅作标签，snow 可作为边界和阻挡素材", () => {
  const table = {
    meadow: {
      ground: ["sand"],
      boundary: ["rock"],
      obstacle: ["stump"],
    },
    snow: {
      ground: ["ts-7-15"],
      boundary: ["snow"],
      obstacle: ["snowy-rock"],
    },
  };
  const renamed = {
    "记忆用甲": table.meadow,
    "记忆用乙": table.snow,
  };
  for (let index = 0; index < 20; index += 1) {
    const mapKey = `test/label-${index}`;
    const original = createPushboxTerrainPicker(mapKey, table, "label-test");
    const changed = createPushboxTerrainPicker(mapKey, renamed, "label-test");
    for (const category of ["ground", "boundary", "obstacle"]) {
      assert.deepEqual(original(category, 2, 3), changed(category, 2, 3));
    }
  }
  const snowOnly = createPushboxTerrainPicker("test/snow", { snow: table.snow });
  assert.deepEqual(snowOnly("boundary", 1, 2), { type: "snow", x: 1, y: 2 });
  const snowTile = createPushboxTerrainPicker("test/snow-tile", {
    winter: {
      ground: ["ts-7-15"],
      boundary: ["ts-5-14"],
      obstacle: ["snowy-rock"],
    },
  });
  assert.deepEqual(snowTile("boundary", 1, 2), { type: "snow", x: 1, y: 2 });
});
