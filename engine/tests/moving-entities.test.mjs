import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  DEFAULT_MOVING_ENTITY_CELL_MS,
} from "../dist/entities/original/moving-entities.js";
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

test("Leaf carries its mounted Bobby and stops before non-water", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.WATER, x: 1, y: 0 },
      { type: EntityTypeId.WATER, x: 2, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 3, y: 0 },
      { type: EntityTypeId.LEAF, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  const leaf = world.query.entitiesWithTrait("moving-platform")[0];

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  assert.equal(world.entity(actor.id).state.mountId, leaf.id);
  const drift = world.update({ tick: 1, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.equal(drift.motions.length, 2);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });

  world.update({ tick: 2, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.equal(world.entity(leaf.id).state.moving, false);
  assert.equal(world.actions.active.length, 0);
  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  assert.equal(world.entity(actor.id).state.mountId, undefined);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
});

test("Wind drives a Cloud through sky and matching Parking stops it", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: "background-variant-072", x: 0, y: 0 },
      { type: "background-variant-072", x: 1, y: 0 },
      { type: "background-variant-072", x: 2, y: 0 },
      { type: "background-variant-072", x: 3, y: 0 },
      { type: EntityTypeId.WINDMILL_RIGHT, x: 0, y: 0 },
      {
        type: EntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        properties: { channel: 3 },
        state: { active: true },
      },
      { type: EntityTypeId.CLOUD_RED, x: 1, y: 0 },
      { type: EntityTypeId.CLOUD_GRID_RED, x: 3, y: 0 },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const cloud = world.query.entitiesWithTrait("cloud")[0] ??
    world.query.entitiesWithTrait("moving-platform")[0];
  world.update({ tick: 2, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 2, y: 0 });
  world.update({ tick: 3, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 3, y: 0 });
  world.update({ tick: 4, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.equal(world.entity(cloud.id).state.moving, false);
});

test("Leaf starts moving on the same tick that its passenger arrives", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
        { type: EntityTypeId.WATER, x: 1, y: 0 },
        { type: EntityTypeId.WATER, x: 2, y: 0 },
        { type: EntityTypeId.WATER, x: 3, y: 0 },
        { type: EntityTypeId.LEAF, x: 1, y: 0 },
        { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 350 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  const leaf = world.query.entitiesWithTrait("leaf")[0];
  move(world, actor.id, "right");

  let handoff = null;
  for (let tick = 0; tick < 7; tick += 1) {
    const result = world.update({ tick, stepMs: 50 });
    if (
      result.motions.some(
        (motion) =>
          motion.entityId === leaf.id && motion.cause.mechanism === "leaf",
      )
    )
      handoff = result;
  }
  assert.ok(handoff);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
});
