import test from "node:test";
import assert from "node:assert/strict";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { levelRuleSelector } from "../dist/world/spatial/EntitySelector.js";
import { World } from "./support/World.mjs";
import { testFactRegistry } from "./support/testFactRegistry.mjs";

test("语义索引在移动、方向、动态 Fact、生成、销毁和恢复后等价于全量查询", () => {
  const registry = new EntityRegistry();
  registry.registerAll([
    { type: "actor", presenceFacts: ["player", "target"] },
    { type: "target", presenceFacts: ["target"] },
    {
      type: "long",
      presenceFacts: [],
      resolveEntityFacts({ entity }) {
        return entity.state?.instance === true ? ["instance"] : [];
      },
      footprint: { byDirection: {
        right: [
          { dx: 0, dy: 0, presenceFacts: ["target"] },
          { dx: 1, dy: 0, presenceFacts: ["target"] },
        ],
        down: [{ dx: 0, dy: 0, presenceFacts: ["other"] }],
      } },
    },
  ]);
  const world = new World({
    schemaVersion: 1, width: 8, height: 8,
    entities: [
      { type: "actor", x: 0, y: 0 },
      { type: "actor", x: 0, y: 1 },
      { type: "target", x: 3, y: 3 },
      { type: "long", x: 4, y: 4, direction: "right" },
    ],
  }, { entities: registry, facts: testFactRegistry("target", "other", "instance", "missing") });
  function check() {
    for (const selector of ["player", "target", "other", "instance", "missing"]) {
      const all = world.entities.all();
      const facts = all.filter((e) => world.query.entityHasFact(e.id, selector));
      const matching = all.filter((e) => e.type === selector || world.query.entityHasFact(e.id, selector));
      assert.deepEqual(world.query.entitiesWithFact(selector), facts);
      assert.deepEqual(world.spatial.entityIdsMatching(levelRuleSelector(selector)), matching.map((e) => e.id));
      assert.equal(world.spatial.entityCountWithFact(selector), facts.length);
      assert.equal(world.spatial.entityCountMatching(levelRuleSelector(selector)), matching.length);
    }
  }
  check();
  const snapshot = world.snapshot();
  world.spatial.moveEntity(1, { x: 1, y: 0 });
  assert.deepEqual(world.query.entitiesWithFact("player").map((e) => e.id), [1, 2]);
  world.entities.require(4).direction = "down";
  world.entities.require(4).state = { instance: true };
  world.spatial.rebuildEntity(4);
  check();
  const spawned = world.entities.spawn({ type: "target", x: 7, y: 7 });
  world.spatial.addEntity(spawned);
  check();
  world.spatial.removeEntity(3);
  world.entities.destroy(3);
  check();
  world.restore(snapshot);
  check();
});

test("静态大地图通过索引推进 tick 与查询玩家和目标", () => {
  const world = new World({
    schemaVersion: 1, width: 40, height: 40,
    entities: [
      ...Array.from({ length: 1600 }, (_, i) => ({
        type: "grass", variant: "ts-10-1", x: i % 40, y: Math.floor(i / 40),
      })),
      { type: "bobby", x: 0, y: 0 },
      { type: "carrot", x: 39, y: 39 },
    ],
    rules: { win: { type: "carrot" } },
  });
  const all = world.entities.all.bind(world.entities);
  let scans = 0;
  world.entities.all = () => {
    scans += 1;
    return all();
  };
  world.update({ tick: 1, stepMs: 62.5 });
  assert.equal(scans, 0);
  assert.equal(world.winState.remaining, 1);
  assert.equal(world.query.entitiesWithFact("player").length, 1);
  assert.equal(scans, 0);
});
