import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  ORIGINAL_EXPLORE_TAG_RULES,
  levelFeatures,
} from "../explore-filter-tags.mjs";

test("Original Explore 场景只由五类明确 Entity 确认", () => {
  assert.deepEqual(
    ORIGINAL_EXPLORE_TAG_RULES.scenes.map((rule) => rule.id),
    ["grassland", "water", "snow", "starfield", "desert"],
  );
  assert.deepEqual(features(MapEntityTypeId.SNOW_CLOUD).scenes, []);
  assert.deepEqual(
    features(
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
  const result = features(
    MapEntityTypeId.MOWER,
    MapEntityTypeId.GAS,
    MapEntityTypeId.BEAVER,
    MapEntityTypeId.LOCK,
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.DREAM_MACHINE,
  );

  assert.deepEqual(result.specialItems, ["gas"]);
  assert.deepEqual(result.mechanics, ["mower"]);
});

test("Original Explore 萝卜数统计 canonical Carrot Entity", () => {
  assert.equal(
    features(
      MapEntityTypeId.CARROT,
      MapEntityTypeId.CARROT,
      MapEntityTypeId.HIGH_GRASS,
    ).carrotCount,
    2,
  );
});

function features(...types) {
  return levelFeatures({
    entities: types.map((type, index) => ({ type, x: index, y: 0 })),
  });
}
