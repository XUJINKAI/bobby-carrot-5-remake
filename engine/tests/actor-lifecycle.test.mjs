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

test("一个 actor downed 不终止双人 World，并可由 engine 能力复活", () => {
  const { world, actorIds } = twoPlayerWorld();
  const [first, second] = actorIds;

  const downed = world.downActor(first, "trap");
  assert.equal(world.dead, false);
  assert.equal(world.actorLifecycle(first).phase, "downed");
  assert.equal(world.actorLifecycle(second).phase, "active");
  assert.deepEqual(
    downed.events.map((event) => event.type),
    ["actor-downed"],
  );

  const revived = world.reviveActor(first);
  assert.equal(world.actorLifecycle(first).phase, "active");
  assert.deepEqual(
    revived.events.map((event) => event.type),
    ["actor-revived"],
  );
});

test("所有玩家都无法行动时 World 才进入 lost", () => {
  const { world, actorIds } = twoPlayerWorld();
  world.downActor(actorIds[0], "first trap");
  const result = world.downActor(actorIds[1], "second trap");

  assert.equal(world.dead, true);
  assert.equal(world.outcome.state.phase, "lost");
  assert.deepEqual(
    result.deltas
      .filter((delta) => delta.type === "world-outcome-changed")
      .map((delta) => delta.outcome.phase),
    ["lost"],
  );
  assert.equal(world.reviveActor(actorIds[0]).events.length, 0);
});

test("actor lifecycle 与 World outcome 进入 snapshot", () => {
  const { world, actorIds } = twoPlayerWorld();
  world.downActor(actorIds[0], "trap");
  const snapshot = world.snapshot();
  world.reviveActor(actorIds[0]);

  world.restore(snapshot);
  assert.equal(world.actorLifecycle(actorIds[0]).phase, "downed");
  assert.equal(world.outcome.state.phase, "playing");
});
