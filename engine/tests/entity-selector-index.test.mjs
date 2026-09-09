import test from "node:test";
import assert from "node:assert/strict";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "../dist/world/World.js";

test("语义索引在移动、方向、实例 Trait、生成、销毁和恢复后等价于全量查询", () => {
  const registry = new EntityRegistry();
  registry.registerAll([
    { type: "actor", traits: ["player", "target"] },
    { type: "target", traits: ["target"] },
    {
      type: "long", traits: [],
      footprint: { byDirection: {
        right: [
          { dx: 0, dy: 0, traits: ["target"] },
          { dx: 1, dy: 0, traits: ["target"] },
        ],
        down: [{ dx: 0, dy: 0, traits: ["other"] }],
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
  }, { entities: registry });
  function check() {
    for (const selector of ["player", "target", "other", "instance", "missing"]) {
      const all = world.entities.all();
      const traits = all.filter((e) => world.query.entityHasTrait(e.id, selector));
      const matching = all.filter((e) => e.type === selector || world.query.entityHasTrait(e.id, selector));
      assert.deepEqual(world.query.entitiesWithTrait(selector), traits);
      assert.deepEqual(world.spatial.entityIdsMatching(selector), matching.map((e) => e.id));
    }
  }
  check();
  const snapshot = world.snapshot();
  world.spatial.moveEntity(1, { x: 1, y: 0 });
  assert.deepEqual(world.query.entitiesWithTrait("player").map((e) => e.id), [1, 2]);
  world.entities.require(4).direction = "down";
  world.entities.require(4).instanceTraits = ["instance"];
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
    rules: { win: { type: "collect-all", target: "carrot" } },
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
  assert.equal(world.query.entitiesWithTrait("player").length, 1);
  assert.equal(scans, 0);
});
