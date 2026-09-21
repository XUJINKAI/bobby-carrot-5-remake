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

function emitterEntities(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_EMITTER,
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

test("关卡起点位于既有光路时可先离开", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 4; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 0 },
  );
  const world = new World(
    { schemaVersion: 1, width: 4, height: 2, entities },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];

  world.update({ tick: 0, stepMs: 16 });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "down",
      cause: { type: "player-input", source: "test" },
    }],
  });
  world.update({ tick: 1, stepMs: 100 });

  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 1 });
});

test("从非发射口方向推动发生器后，光束从新位置重新投影", () => {
  const entities = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 1, y: 1 },
    { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 4,
    entities,
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const emitter = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_EMITTER,
  })[0];

  const pushed = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "down",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(pushed.moves[0].moved, true);
  assert.deepEqual(world.entity(emitter.id).anchor, { x: 1, y: 2 });

  world.update({ tick: 0, stepMs: 16 });
  assert.deepEqual(
    beamEntities(world).map((beam) => beam.anchor),
    [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ],
  );
});

test("激光从背面命中同向发生器时只摧毁目标", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities,
  });
  const [source, target] = emitterEntities(world);

  world.update({ tick: 0, stepMs: 16 });

  assert.deepEqual(
    emitterEntities(world).map((emitter) => emitter.id),
    [source.id],
  );
  assert.equal(world.entity(target.id), undefined);
  assert.equal(
    beamEntities(world).some((beam) => beam.state?.sourceId === target.id),
    false,
  );

  world.update({ tick: 1, stepMs: 16 });
  assert.deepEqual(
    beamEntities(world).map((beam) => beam.anchor),
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ],
  );
});

test("把相向发生器推入同一直线后两者同时摧毁", () => {
  const entities = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 1 },
    { type: MapEntityTypeId.LASER_EMITTER, direction: "left", x: 4, y: 2 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 3 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 4,
    entities,
  });
  const actor = world.query.entitiesWithFact("player")[0];

  const pushed = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(pushed.moves[0].moved, true);

  world.update({ tick: 0, stepMs: 16 });

  assert.deepEqual(emitterEntities(world), []);
  assert.deepEqual(beamEntities(world), []);
});
