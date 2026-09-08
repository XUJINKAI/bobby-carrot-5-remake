import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  ORIGINAL_EXPLORE_FILTER_DEFINITIONS,
  originalExploreFilters,
  originalExploreMapFilters,
} from "../explore-filter-tags.mjs";

test("Original Explore filter 定义发布 UI 字段并保留扫描依据", () => {
  const published = originalExploreFilters();
  assert.equal(published[0].selection, "single");
  assert.equal(published.slice(1).every((filter) => filter.selection === "multiple"), true);
  assert.equal(
    published.flatMap((filter) => filter.options).some((option) => "match" in option),
    false,
  );
  assert.equal(
    ORIGINAL_EXPLORE_FILTER_DEFINITIONS.flatMap((filter) => filter.options)
      .every((option) => "match" in option),
    true,
  );
});

test("Original Explore 萝卜数区间由统一 filter 定义匹配", () => {
  assert.deepEqual(filters().carrots, ["0-10"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 10)).carrots, ["0-10"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 11)).carrots, ["11-20"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 20)).carrots, ["11-20"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 21)).carrots, ["21-40"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 40)).carrots, ["21-40"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 41)).carrots, ["41-60"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 60)).carrots, ["41-60"]);
  assert.deepEqual(filters(...entities(MapEntityTypeId.CARROT, 61)).carrots, ["61+"]);
});

test("Original Explore 场景只由五类明确 Entity 确认", () => {
  assert.deepEqual(
    filterDefinition("scenes").options.map((option) => option.id),
    ["grassland", "water", "snow", "starfield", "desert"],
  );
  assert.deepEqual(filters(MapEntityTypeId.SNOW_CLOUD).scenes, []);
  assert.deepEqual(
    filters(
      MapEntityTypeId.GRASS,
      MapEntityTypeId.WATERFALL,
      MapEntityTypeId.SNOW,
      MapEntityTypeId.STARFIELD,
      MapEntityTypeId.SAND,
    ).scenes,
    ["grassland", "water", "snow", "starfield", "desert"],
  );
});

test("Original Explore 标签表区分特殊道具与机关", () => {
  const result = filters(
    MapEntityTypeId.MOWER,
    MapEntityTypeId.GAS,
    MapEntityTypeId.BEAVER,
    MapEntityTypeId.LOCK,
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.DREAM_MACHINE,
  );

  assert.deepEqual(result.items, ["gas"]);
  assert.deepEqual(result.mechanics, ["mower"]);
});

function filterDefinition(id) {
  const definition = ORIGINAL_EXPLORE_FILTER_DEFINITIONS.find(
    (filter) => filter.id === id,
  );
  assert.ok(definition);
  return definition;
}

function filters(...types) {
  return originalExploreMapFilters({
    entities: types.map((type, index) => ({ type, x: index, y: 0 })),
  });
}

function entities(type, count) {
  return Array.from({ length: count }, () => type);
}
