import test from "node:test";
import assert from "node:assert/strict";
import { World } from "./support/World.mjs";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { testFactRegistry } from "./support/testFactRegistry.mjs";

test("TickIndex 保持远处机关、去重、commit 边界与快照恢复顺序", () => {
  const entities = new EntityRegistry();
  entities.registerAll([
    { type: "static", presenceFacts: ["late"] },
    { type: "ticking", presenceFacts: ["clock"], behaviors: ["tick"] },
    {
      type: "tail-only", presenceFacts: [],
      footprint: { parts: [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 0, presenceFacts: ["clock"] },
      ] },
    },
  ]);
  const calls = [];
  const behaviors = new BehaviorRegistry();
  behaviors.register({
    id: "tick",
    onTick({ self, commands }) {
      calls.push(self.entity.id);
      if (self.entity.anchor.x === 90) {
        commands.destroy(self.entity.id);
        commands.spawn({ type: "ticking", x: 92, y: 0 });
      }
    },
  });
  const world = new World({
    schemaVersion: 1, width: 100, height: 1,
    entities: [
      { type: "static", x: 0, y: 0 },
      { type: "ticking", x: 90, y: 0 },
      { type: "ticking", x: 91, y: 0 },
      { type: "tail-only", x: 20, y: 0 },
    ],
  }, { entities, behaviors, facts: testFactRegistry("late", "clock") });
  const snapshot = world.snapshot();
  function tick(expected) {
    calls.length = 0;
    world.update({ tick: 1, stepMs: 62.5 });
    assert.deepEqual(calls, expected);
  }
  tick([2, 3]);
  tick([3, 5]);
  world.restore(snapshot);
  tick([2, 3]);
  tick([3, 5]);
  entities.register({ type: "new-clock", presenceFacts: [], behaviors: ["tick"] });
  const spawned = world.entities.spawn({ type: "new-clock", x: 99, y: 0 });
  world.spatial.addEntity(spawned);
  tick([3, 5, spawned.id]);
});
