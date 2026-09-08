import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { DEFAULT_MOVING_ENTITY_CELL_MS } from "../dist/entities/original/moving-entities.js";
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

test("Leaf stops before an occupied water cell", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
      { type: MapEntityTypeId.CRUMBLY_ROCK, x: 2, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const bobby = world.query.entitiesWithTrait("player")[0];
  const leaf = world.query.entitiesWithTrait("leaf")[0];

  assert.equal(move(world, bobby.id, "right").moves[0].moved, true);
  world.update({ tick: 1, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });

  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(leaf.id).state?.moving, false);
  assert.equal(world.actions.active.length, 0);
});

test("Cloud stops before Plank but may enter Cloud Grid infrastructure", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, x: 0, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 1, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 2, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 3, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.WINDMILL, x: 0, y: 0, direction: "right" },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        direction: "right",
        active: true,
      },
      { type: MapEntityTypeId.CLOUD, x: 1, y: 0, color: "red" },
      { type: MapEntityTypeId.PLANK, x: 2, y: 0 },
      { type: MapEntityTypeId.CLOUD_PARKING, x: 3, y: 0, color: "red" },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const cloud = world.query.entitiesWithTrait("cloud")[0];
  world.update({ tick: 2, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });

  assert.deepEqual(world.entity(cloud.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(cloud.id).state?.moving, false);
});

test("Cloud Grid does not count as support occupancy", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, x: 0, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 1, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 2, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.WINDMILL, x: 0, y: 0, direction: "right" },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        direction: "right",
        active: true,
      },
      { type: MapEntityTypeId.CLOUD, x: 1, y: 0, color: "red" },
      { type: MapEntityTypeId.CLOUD_PARKING, x: 2, y: 0, color: "red" },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const cloud = world.query.entitiesWithTrait("cloud")[0];
  world.update({ tick: 2, stepMs: DEFAULT_MOVING_ENTITY_CELL_MS });

  assert.deepEqual(world.entity(cloud.id).anchor, { x: 2, y: 0 });
});
