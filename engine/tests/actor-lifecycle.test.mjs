import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "../dist/world/World.js";

function twoPlayerWorld() {
  const entities = new EntityRegistry();
  entities.registerAll([
    { type: "floor", traits: ["walkable"], layer: "surface", stackOrder: 0 },
    { type: "player", traits: ["player"], layer: "object", stackOrder: 100 },
  ]);
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        { type: "floor", x: 0, y: 0 },
        { type: "floor", x: 1, y: 0 },
        { type: "floor", x: 2, y: 0 },
        { type: "player", x: 0, y: 0 },
        { type: "player", x: 2, y: 0 },
      ],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  return {
    world,
    actorIds: world.query.entitiesWithTrait("player").map((actor) => actor.id),
  };
}

test("任一 actor downed 会立即终止双人 World", () => {
  const { world, actorIds } = twoPlayerWorld();
  const [first, second] = actorIds;

  const downed = world.downActor(first, "trap");
  assert.equal(world.dead, true);
  assert.equal(world.actorLifecycle(first).phase, "downed");
  assert.equal(world.actorLifecycle(second).phase, "active");
  assert.deepEqual(
    downed.events.map((event) => event.type),
    ["actor-downed", "death"],
  );
  assert.equal(world.outcome.state.actorId, first);
  assert.equal(world.reviveActor(first).events.length, 0);
});

test("失败归因于最先进入非 active 状态的 actor", () => {
  const { world, actorIds } = twoPlayerWorld();
  const result = world.downActor(actorIds[1], "second trap");

  assert.equal(world.dead, true);
  assert.equal(world.outcome.state.phase, "lost");
  assert.equal(world.outcome.state.actorId, actorIds[1]);
  assert.equal(world.outcome.state.reason, "second trap");
  assert.deepEqual(
    result.deltas
      .filter((delta) => delta.type === "world-outcome-changed")
      .map((delta) => delta.outcome.phase),
    ["lost"],
  );
});

test("actor lifecycle 与 World outcome 进入 snapshot", () => {
  const { world, actorIds } = twoPlayerWorld();
  world.downActor(actorIds[0], "trap");
  const snapshot = world.snapshot();

  world.restore(snapshot);
  assert.equal(world.actorLifecycle(actorIds[0]).phase, "downed");
  assert.equal(world.outcome.state.phase, "lost");
});
