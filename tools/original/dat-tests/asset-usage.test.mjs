import assert from "node:assert/strict";
import test from "node:test";
import {
  findOriginalTsUsage,
  formatOriginalTemporarySurfaceUsage,
  parseTsAssetQuery,
} from "../asset-usage.mjs";

test("素材反查接受常用 ts.png 坐标写法", () => {
  assert.deepEqual(parseTsAssetQuery("ts-4-13"), { row: 4, column: 13 });
  assert.deepEqual(parseTsAssetQuery("ts(4,13)"), { row: 4, column: 13 });
  assert.deepEqual(parseTsAssetQuery("surface-4-13"), {
    row: 4,
    column: 13,
  });
  assert.throws(() => parseTsAssetQuery("ts-17-1"), /超出 1~16/);
});

test("未命名素材通过坐标型临时 Entity 反查地图与原版位置", () => {
  const catalog = {
    maps: [
      {
        id: "1-1",
        chapter: "1",
        kind: "level",
        source: { release: "base", packFile: "01", levelIndex: 1 },
      },
    ],
    specialScenes: [],
  };
  const result = findOriginalTsUsage(
    catalog,
    () => ({
      meta: { name: "1-1" },
      entities: [
        { type: "surface-14-10", x: 2, y: 3 },
        { type: "surface-14-10", x: 5, y: 8 },
      ],
    }),
    { row: 14, column: 10 },
  );
  assert.equal(result.selector.type, "surface-14-10");
  assert.equal(result.mapCount, 1);
  assert.equal(result.occurrenceCount, 2);
  assert.deepEqual(result.maps[0].occurrences, [
    { x: 2, y: 3 },
    { x: 5, y: 8 },
  ]);
});

test("已归类素材通过 semantic type 与 atlas variant 精确反查", () => {
  const catalog = {
    maps: [{ id: "2-1", source: null }],
    specialScenes: [],
  };
  const result = findOriginalTsUsage(
    catalog,
    () => ({
      meta: { name: "2-1" },
      entities: [
        { type: "tree", x: 1, y: 1, variant: "ts-1-14" },
        { type: "tree", x: 2, y: 2, variant: "ts-1-15" },
      ],
    }),
    { row: 1, column: 14 },
  );
  assert.deepEqual(result.selector, {
    type: "tree",
    fields: { variant: "ts-1-14" },
  });
  assert.deepEqual(result.maps[0].occurrences, [{ x: 1, y: 1 }]);
});

test("Dragon 吐火帧反查包含 runtime visual 与直接地形引用", () => {
  const catalog = {
    maps: [{ id: "1-1" }, { id: "15-2" }],
    specialScenes: [],
  };
  const documents = {
    "1-1": {
      entities: [{ type: "dragon", x: 4, y: 5, direction: "left" }],
    },
    "15-2": {
      entities: [{ type: "surface-15-10", x: 8, y: 0 }],
    },
  };
  const result = findOriginalTsUsage(
    catalog,
    (entry) => documents[entry.id],
    { row: 15, column: 10 },
  );

  assert.deepEqual(result.runtimeVisual, {
    type: "dragon",
    label: "Dragon head 吐火第二帧",
  });
  assert.equal(result.mapCount, 2);
  assert.equal(result.occurrenceCount, 2);
  assert.deepEqual(result.maps[0].occurrences, [
    { x: 4, y: 5, usage: "Dragon head 吐火第二帧" },
  ]);
  assert.deepEqual(result.maps[1].occurrences, [{ x: 8, y: 0 }]);
});

test("临时素材总表给出可继续反查的坐标身份", () => {
  assert.equal(
    formatOriginalTemporarySurfaceUsage({
      temporarySurfaceCount: 1,
      surfaces: [
        {
          label: "ts-14-10",
          type: "surface-14-10",
          mapCount: 2,
          occurrenceCount: 5,
          maps: ["1-1", "2-1"],
        },
      ],
    }),
    [
      "临时 Surface：1 种",
      "ts-14-10 → surface-14-10：2 张地图，5 个 anchor",
      "逐项反查：node tools/cli.mjs original usage ts-<row>-<column>",
      "",
    ].join("\n"),
  );
});
