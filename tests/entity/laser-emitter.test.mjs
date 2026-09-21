import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { World } from "../support/engine/World.mjs";

const ground = (x, y) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y,
});

function beamEntities(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  });
}

test("激光从发生器沿固定方向延伸，并停在首个阻挡格", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1)
    for (let x = 0; x < 6; x += 1) entities.push(ground(x, y));
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.PUSHABLE_STONE, x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities,
  });

  assert.deepEqual(
    beamEntities(world).map((beam) => ({
      x: beam.anchor.x,
      y: beam.anchor.y,
      terminal: beam.state?.terminal,
    })),
    [
      { x: 1, y: 0, terminal: false },
      { x: 2, y: 0, terminal: false },
      { x: 3, y: 0, terminal: true },
    ],
  );
});

test("Bobby 进入激光格时在移动中点死亡", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1)
    for (let x = 0; x < 4; x += 1) entities.push(ground(x, y));
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 1, y: 1 },
  );
  const world = new World(
    { schemaVersion: 1, width: 4, height: 2, entities },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];

  world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  world.update({ tick: 0, stepMs: 60 });

  assert.equal(world.dead, true);
  assert.equal(world.actorLifecycle(actor.id).reason, "laser-beam");
  assert.equal(world.movement.motions.forEntity(actor.id).status, "interrupted");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.5);
});
