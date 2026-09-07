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
        { type: "surface-4-13", x: 2, y: 3 },
        { type: "surface-4-13", x: 5, y: 8 },
      ],
    }),
    { row: 4, column: 13 },
  );
  assert.equal(result.selector.type, "surface-4-13");
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
    composite: false,
  });
  assert.deepEqual(result.maps[0].occurrences, [{ x: 1, y: 1 }]);
});

test("临时素材总表给出可继续反查的坐标身份", () => {
  assert.equal(
    formatOriginalTemporarySurfaceUsage({
      temporarySurfaceCount: 1,
      surfaces: [
        {
          label: "ts-4-13",
          type: "surface-4-13",
          mapCount: 2,
          occurrenceCount: 5,
          maps: ["1-1", "2-1"],
        },
      ],
    }),
    [
      "临时 Surface：1 种",
      "ts-4-13 → surface-4-13：2 张地图，5 个 anchor",
      "逐项反查：npm run original:usage -- ts-<row>-<column>",
      "",
    ].join("\n"),
  );
});
