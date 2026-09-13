import test from "node:test";
import assert from "node:assert/strict";
import { EntitySelectorIndex } from "../dist/world/spatial/EntitySelectorIndex.js";
import { levelRuleSelector } from "../dist/world/spatial/EntitySelector.js";
import { World } from "./support/World.mjs";

test("selector 计数覆盖 type、Fact、交集、多格去重与空集合", () => {
  const index = new EntitySelectorIndex();
  function add(id, type, facts) {
    index.add({ id, type }, [
      { facts },
      { facts },
    ]);
  }
  add(1, "target", ["target"]);
  add(2, "target", []);
  add(3, "other", ["target"]);
  add(4, "other", ["target"]);
  assert.equal(index.countMatching(levelRuleSelector("target")), 4);
  assert.equal(index.countMatching({ kind: "type", value: "target" }), 2);
  assert.equal(index.countMatching({ kind: "fact", value: "target" }), 3);
  assert.equal(index.countWithFact("target"), 3);
  assert.equal(index.countMatching(levelRuleSelector("other")), 2);
  index.remove(4);
  index.remove(3);
  assert.equal(index.countMatching(levelRuleSelector("target")), 2);
  assert.equal(index.countMatching(levelRuleSelector("other")), 0);
  index.remove(1);
  assert.equal(index.countMatching(levelRuleSelector("target")), 1);
  index.remove(2);
  add(5, "other", ["target"]);
  assert.equal(index.countMatching(levelRuleSelector("target")), 1);
  index.clear();
  assert.equal(index.countWithFact("target"), 0);
  assert.equal(index.countMatching(levelRuleSelector("target")), 0);
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
  world.spatial.entityCountWithFact = () => {
    assert.fail("奖励计数应按 Type 查询");
  };
  world.update({ tick: 1, stepMs: 62.5 });
  assert.equal(world.winState.remaining, 1);
  assert.equal(world.state.metrics["golden-carrot"], 1);
  assert.equal(world.state.metrics["bonus-coin"], 1);
});
