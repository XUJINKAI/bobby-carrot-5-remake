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

test("Mower mounts on arrival, cuts on arrival, and parks with Bobby to the right", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 6,
      height: 1,
      entities: [
        ...Array.from({ length: 6 }, (_, x) => ({
          type: EntityTypeId.GROUND_C,
          x,
          y: 0,
        })),
        { type: EntityTypeId.GAS, x: 1, y: 0 },
        { type: EntityTypeId.MOWER, x: 2, y: 0 },
        { type: EntityTypeId.HIGH_GRASS, x: 3, y: 0 },
        { type: EntityTypeId.MOWER_PARKING, x: 4, y: 0 },
        { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  const mower = world.query.entitiesWithTrait("mower")[0];

  move(world, actor.id, "right");
  world.update({ tick: 1, stepMs: 100 });
  assert.equal(world.entity(actor.id).state.gas, true);

  move(world, actor.id, "right");
  world.update({ tick: 2, stepMs: 50 });
  assert.equal(world.entity(actor.id).state.mountId, undefined);
  world.update({ tick: 3, stepMs: 50 });
  assert.equal(world.entity(actor.id).state.mountId, mower.id);

  move(world, actor.id, "right");
  assert.deepEqual(world.entity(mower.id).anchor, { x: 3, y: 0 });
  assert.equal(world.query.entitiesWithTrait("mowable").length, 1);
  world.update({ tick: 4, stepMs: 100 });
  assert.equal(world.query.entitiesWithTrait("mowable").length, 0);

  move(world, actor.id, "right");
  world.update({ tick: 5, stepMs: 100 });
  assert.deepEqual(world.entity(mower.id).anchor, { x: 4, y: 0 });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 5, y: 0 });
  assert.equal(world.entity(actor.id).state.mountId, undefined);
});

test("Only a speed-continued Mower smashes Crumbly Rock", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      {
        type: EntityTypeId.MOWER,
        x: 0,
        y: 0,
        state: { mountedByActorId: 2 },
      },
      { type: EntityTypeId.CRUMBLY_ROCK, x: 1, y: 0 },
      {
        type: EntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "right",
        state: {
          mountId: 1,
          speedBoost: { direction: "right", phase: "full" },
        },
      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  const mower = world.query.entitiesWithTrait("mower")[0];
  world.entities.require(actor.id).state = {
    mountId: mower.id,
    speedBoost: { direction: "right", phase: "full" },
  };
  world.entities.require(mower.id).state = { mountedByActorId: actor.id };

  const result = move(world, actor.id, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(world.query.entitiesWithTrait("crumbly-rock").length, 0);
  assert.ok(
    result.events.some((event) => event.type === "crumbly-rock-smashed"),
  );
});

test("Mower cannot complete an Exit reach condition", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.EXIT, x: 1, y: 0 },
      { type: EntityTypeId.MOWER, x: 0, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
    rules: { win: { type: "reach", target: EntityTypeId.EXIT } },
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  const mower = world.query.entitiesWithTrait("mower")[0];
  world.entities.require(actor.id).state = { mountId: mower.id };
  world.entities.require(mower.id).state = { mountedByActorId: actor.id };

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  assert.equal(world.completed, false);
});
