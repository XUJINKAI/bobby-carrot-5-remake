import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";

function move(world, actorId, direction) {
  return world.step({
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input" },
      },
    ],
  });
}

test("Plank becomes a spent World fact without a gameplay decay timer", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.WATER, x: 1, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 2, y: 0 },
      { type: EntityTypeId.PLANK, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  const left = move(world, actor.id, "right");
  assert.equal(left.moves[0].moved, true);
  assert.ok(left.events.some((event) => event.type === "plank-decay-started"));

  const plank = world.query.entitiesWithTrait("terrain-overlay").find(
    (entity) => entity.type === EntityTypeId.PLANK,
  );
  assert.equal(plank.state.spent, true);
  assert.equal(world.actions.active.length, 0);
  assert.equal(move(world, actor.id, "left").moves[0].moved, false);
});

test("A spent Plank on ordinary ground does not become blocking", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 2, y: 0 },
      { type: EntityTypeId.PLANK, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];

  move(world, actor.id, "right");
  move(world, actor.id, "right");
  assert.equal(move(world, actor.id, "left").moves[0].moved, true);
});
