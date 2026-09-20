import test from "node:test";
import assert from "node:assert/strict";
import { EntitySelectorIndex } from "../../../engine/dist/world/spatial/EntitySelectorIndex.js";
import { levelRuleSelector } from "../../../engine/dist/world/spatial/EntitySelector.js";
import { World } from "../../support/engine/World.mjs";

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
    rules: { win: { type: "carrot" } },
  });
  world.spatial.entityCountWithFact = () => {
    assert.fail("奖励计数应按 Type 查询");
  };
  assert.equal(world.winState.remaining, 1);
  assert.equal(world.query.entityCountMatching(levelRuleSelector("carrot")), 1);
  assert.equal(world.query.entitiesMatching(levelRuleSelector("carrot")).length, 1);
  assert.equal(world.metrics["golden-carrot"], 1);
  assert.equal(world.metrics["bonus-coin"], 1);
});

test("WorldQueryApi 递归拒绝 typed selector 中未注册的 Fact", () => {
  const world = new World({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0 },
    ],
    rules: { win: { type: "carrot" } },
  });
  const missing = { kind: "fact", value: "missing-fact" };
  const nested = {
    kind: "any",
    selectors: [
      { kind: "type", value: "bobby" },
      missing,
    ],
  };
  const presence = world.query.presencesAt({ x: 0, y: 0 })[0];

  assert.throws(() => world.query.entitiesMatching(missing), /未注册 Fact：missing-fact/);
  assert.throws(() => world.query.entityCountMatching(nested), /未注册 Fact：missing-fact/);
  assert.throws(
    () => world.query.hasSelectorAt({ x: 0, y: 0 }, missing),
    /未注册 Fact：missing-fact/,
  );
  assert.throws(
    () => world.query.presenceMatchesSelector(presence, missing),
    /未注册 Fact：missing-fact/,
  );
  assert.equal(world.query.entityCountMatching(levelRuleSelector("bobby")), 1);
});
