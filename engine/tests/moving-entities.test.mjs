import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId, MapEntityTypeId } from "@bobby/model";
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

test("Leaf carries co-located Bobby without creating a mount relation", () => {
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
  assert.equal(world.entity(actor.id).state?.mountId, undefined);
  const drift = world.update({ tick: 1, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.equal(drift.motions.length, 2);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.entity(actor.id).state?.mountId, undefined);

  world.update({ tick: 2, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.equal(world.entity(leaf.id).state.moving, false);
  assert.equal(world.actions.active.length, 0);
  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  assert.equal(world.entity(actor.id).state?.mountId, undefined);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
});

test("Leaf carries every player currently on its cell", () => {
  const world = new World({
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
      { type: EntityTypeId.BOBBY, x: 1, y: 0, direction: "right" },
    ],
  });
  const players = world.query.entitiesWithTrait("player");
  const leaf = world.query.entitiesWithTrait("leaf")[0];

  assert.equal(move(world, players[0].id, "right").moves[0].moved, true);
  const drift = world.update({ tick: 1, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });
  assert.equal(drift.motions.length, 3);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(players[0].id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(players[1].id).anchor, { x: 2, y: 0 });
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
      { type: MapEntityTypeId.WINDMILL, x: 0, y: 0, direction: "right" },
      {
        type: EntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        direction: "right",
        active: true,
      },
      { type: MapEntityTypeId.CLOUD, x: 1, y: 0, color: "red" },
      { type: MapEntityTypeId.CLOUD_PARKING, x: 3, y: 0, color: "red" },
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

test("Leaf starts moving on the same tick that a player arrives", () => {
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
  assert.equal(world.entity(actor.id).state?.mountId, undefined);
});

test("Leaf can launch perpendicular to Tide and follows Tide after the first cell", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 3,
      entities: [
        { type: EntityTypeId.GROUND_C, x: 0, y: 1 },
        { type: EntityTypeId.WATER, x: 1, y: 1 },
        { type: EntityTypeId.WATER, x: 2, y: 1 },
        { type: EntityTypeId.WATER, x: 2, y: 2 },
        { type: EntityTypeId.TIDE, x: 1, y: 1, direction: "down" },
        { type: EntityTypeId.TIDE, x: 2, y: 1, direction: "down" },
        { type: EntityTypeId.LEAF, x: 1, y: 1 },
        { type: EntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  const leaf = world.query.entitiesWithTrait("leaf")[0];
  assert.equal(move(world, actor.id, "right").moves[0].moved, true);

  let sawPerpendicularCell = false;
  let sawRedirectedCell = false;
  for (let tick = 1; tick <= 20; tick += 1) {
    world.update({ tick, stepMs: 100 });
    const anchor = world.entity(leaf.id).anchor;
    if (anchor.x === 2 && anchor.y === 1) sawPerpendicularCell = true;
    if (anchor.x === 2 && anchor.y === 2) {
      sawRedirectedCell = true;
      break;
    }
  }

  assert.equal(sawPerpendicularCell, true);
  assert.equal(sawRedirectedCell, true);
});

test("Leaf does not launch against Tide", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 3,
      entities: [
        { type: EntityTypeId.WATER, x: 1, y: 1 },
        { type: EntityTypeId.GROUND_C, x: 1, y: 2 },
        { type: EntityTypeId.TIDE, x: 1, y: 1, direction: "down" },
        { type: EntityTypeId.LEAF, x: 1, y: 1 },
        { type: EntityTypeId.BOBBY, x: 1, y: 2, direction: "up" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  const leaf = world.query.entitiesWithTrait("leaf")[0];
  assert.equal(move(world, actor.id, "up").moves[0].moved, true);

  for (let tick = 1; tick <= 4; tick += 1)
    world.update({ tick, stepMs: 50 });

  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 1 });
  assert.equal(world.entity(leaf.id).state?.moving, undefined);
  assert.equal(world.actions.active.length, 0);
});
