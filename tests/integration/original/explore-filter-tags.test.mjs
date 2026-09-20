import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  ORIGINAL_EXPLORE_FILTER_DEFINITIONS,
  originalExploreFilters,
  originalExploreMapFilters,
} from "../../../tools/original/explore-filter-tags.mjs";

test("Original Explore filter 定义发布 UI 字段并保留扫描依据", () => {
  const published = originalExploreFilters();
  assert.equal(published[0].selection, "single");
  assert.equal(published[1].selection, "single");
  assert.equal(
    published.slice(2).every((filter) => filter.selection === "multiple"),
    true,
  );
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

test("Original Explore 目标筛选读取关卡获胜规则", () => {
  assert.deepEqual(
    filters({
      types: [MapEntityTypeId.CARROT, MapEntityTypeId.EGG],
      win: {
        type: "all",
        conditions: [{ type: "egg" }, { type: "exit" }],
      },
    }).targets,
    ["egg"],
  );
  assert.deepEqual(
    filters({
      types: [MapEntityTypeId.CARROT],
      win: { type: "carrot" },
    }).targets,
    ["carrot"],
  );
});

test("Original Explore 目标数区间统计彩蛋", () => {
  assert.deepEqual(filters()["target-count"], ["0-10"]);
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 10) })["target-count"],
    ["0-10"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 11) })["target-count"],
    ["11-20"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 20) })["target-count"],
    ["11-20"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 21) })["target-count"],
    ["21-40"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 40) })["target-count"],
    ["21-40"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 41) })["target-count"],
    ["41-60"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 60) })["target-count"],
    ["41-60"],
  );
  assert.deepEqual(
    filters({ types: entities(MapEntityTypeId.EGG, 61) })["target-count"],
    ["61+"],
  );
});

test("Original Explore 场景只由五类明确 Entity 确认", () => {
  assert.deepEqual(
    filterDefinition("scenes").options.map((option) => option.id),
    ["grassland", "water", "snow", "starfield", "desert"],
  );
  assert.deepEqual(filters({ types: [MapEntityTypeId.SNOW_CLOUD] }).scenes, []);
  assert.deepEqual(
    filters({
      types: [
        MapEntityTypeId.GRASS,
        MapEntityTypeId.WATERFALL,
        MapEntityTypeId.SNOW,
        MapEntityTypeId.STARFIELD,
        MapEntityTypeId.SAND,
      ],
    }).scenes,
    ["grassland", "water", "snow", "starfield", "desert"],
  );
});

test("Original Explore 道具与机关发布当前分类与组合图标", () => {
  const result = filters({
    types: [
      MapEntityTypeId.HIGH_GRASS,
      MapEntityTypeId.BEAN_FIELD,
      MapEntityTypeId.SNOW,
      MapEntityTypeId.LANDING,
      MapEntityTypeId.SPEED_SWITCH,
      MapEntityTypeId.LEAF,
      MapEntityTypeId.COLOR_BLOCK,
      MapEntityTypeId.CAROUSEL_SWITCH,
      MapEntityTypeId.MIRROR,
      MapEntityTypeId.WIND_SWITCH,
      MapEntityTypeId.TRAP,
      MapEntityTypeId.PLANK,
    ],
  });

  assert.deepEqual(result.mechanics, [
    "speed",
    "highgrass",
    "bean",
    "shovel",
    "kite",
    "leaf",
    "color",
    "carousel",
    "dragon",
    "wind",
    "trap",
    "plank",
  ]);

  const mechanics = originalExploreFilters().find(
    (filter) => filter.id === "mechanics",
  );
  assert.ok(mechanics);
  assert.deepEqual(
    mechanics.options.map((option) => ({
      id: option.id,
      name: option.name,
      icons: option.icons.map((icon) => icon.entity.type),
    })),
    [
      {
        id: "speed",
        name: "加速带",
        icons: ["speed", "speed-switch"],
      },
      {
        id: "mower",
        name: "割草机/高草",
        icons: ["gas", "mower"],
      },
      {
        id: "highgrass",
        name: "高草",
        icons: ["high-grass"],
      },
      {
        id: "crumblyrock",
        name: "易碎岩石",
        icons: ["crumbly-rock"],
      },
      {
        id: "bean",
        name: "魔豆",
        icons: ["bean", "bean-field"],
      },
      {
        id: "shovel",
        name: "雪铲/积雪",
        icons: ["shovel-pickup", "snow"],
      },
      {
        id: "kite",
        name: "风筝/龙卷风",
        icons: ["kite", "whirlwind", "landing"],
      },
      {
        id: "tide",
        name: "潮汐",
        icons: ["tide", "tide-switch"],
      },
      {
        id: "leaf",
        name: "叶子",
        icons: ["leaf"],
      },
      {
        id: "color",
        name: "彩色方块",
        icons: ["color-block", "color-switch"],
      },
      {
        id: "carousel",
        name: "旋转通道",
        icons: ["carousel", "carousel-switch"],
      },
      {
        id: "dragon",
        name: "龙/镜子/冰块",
        icons: ["dragon", "mirror", "ice-block"],
      },
      {
        id: "wind",
        name: "风车/云",
        icons: ["windmill", "wind-switch", "cloud"],
      },
      { id: "trap", name: "陷阱", icons: ["trap"] },
      { id: "plank", name: "木板", icons: ["plank"] },
    ],
  );
});

function filterDefinition(id) {
  const definition = ORIGINAL_EXPLORE_FILTER_DEFINITIONS.find(
    (filter) => filter.id === id,
  );
  assert.ok(definition);
  return definition;
}

function filters({ types = [], win } = {}) {
  return originalExploreMapFilters({
    entities: types.map((type, index) => ({ type, x: index, y: 0 })),
    ...(win ? { rules: { win } } : {}),
  });
}

function entities(type, count) {
  return Array.from({ length: count }, () => type);
}
