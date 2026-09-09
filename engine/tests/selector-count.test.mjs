import test from "node:test";
import assert from "node:assert/strict";
import { EntitySelectorIndex } from "../dist/world/spatial/EntitySelectorIndex.js";
import { World } from "../dist/world/World.js";

test("selector 计数覆盖 type、Trait、交集、多格去重与空集合", () => {
  const index = new EntitySelectorIndex();
  function add(id, type, traits) {
    index.add({ id, type }, { traits }, [
      { traits },
      { traits },
    ]);
  }
  add(1, "target", ["target"]);
  add(2, "target", []);
  add(3, "other", ["target"]);
  add(4, "other", ["target"]);
  assert.equal(index.countMatching("target"), 4);
  assert.equal(index.countWithTrait("target"), 3);
  assert.equal(index.countMatching("other"), 2);
  index.remove(4);
  index.remove(3);
  assert.equal(index.countMatching("target"), 2);
  assert.equal(index.countMatching("other"), 0);
  index.remove(1);
  assert.equal(index.countMatching("target"), 1);
  index.remove(2);
  add(5, "other", ["target"]);
  assert.equal(index.countMatching("target"), 1);
  index.clear();
  assert.equal(index.countWithTrait("target"), 0);
  assert.equal(index.countMatching("target"), 0);
});

test("目标求值和派生奖励计数直接使用计数接口", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: "bobby", x: 0, y: 0 },
      { type: "carrot", x: 1, y: 0 },
      { type: "golden-carrot", x: 2, y: 0 },
      { type: "bonus-coin", x: 3, y: 0 },
    ],
    rules: { win: { type: "collect-all", target: "carrot" } },
  });
  world.spatial.entityIdsMatching = () => {
    assert.fail("目标计数应直接读取索引数量");
  };
  const withTrait = world.spatial.entityIdsWithTrait.bind(world.spatial);
  world.spatial.entityIdsWithTrait = (trait) => {
    assert.ok(!["golden-carrot", "bonus-coin"].includes(trait));
    return withTrait(trait);
  };
  world.update({ tick: 1, stepMs: 62.5 });
  assert.equal(world.winState.remaining, 1);
  assert.equal(world.state.goldenCarrotsInLevel, 1);
  assert.equal(world.state.bonusCoinsInLevel, 1);
});
