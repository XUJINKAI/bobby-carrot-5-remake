import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../engine/dist/public.js";
import {
  createBuiltinBehaviorRegistry,
  createBuiltinEntityRegistry,
} from "../../engine/dist/entities/registry.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
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

test("四向激光发生器使用对应的 Robo 2 原图", () => {
  for (const direction of ["up", "right", "down", "left"]) {
    const visual = resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.LASER_EMITTER,
      direction,
    });
    assert.deepEqual(visual?.layers[0], {
      kind: "image",
      asset: ROBO2_GAMEPLAY_IMAGE_IDS.emitter[direction],
      sourceTileSize: 12,
      anchor: "top-left",
    });
    assert.equal(visual?.layers[1]?.kind, "canvas");
  }
});

test("激光使用单次纯红色描边", () => {
  const visual = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.LASER_EMITTER,
    direction: "right",
  });
  const layer = visual?.layers[1];
  assert.equal(layer?.kind, "canvas");

  const strokes = [];
  const context = {
    strokeStyle: "",
    lineWidth: 0,
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      strokes.push({
        color: this.strokeStyle,
        width: this.lineWidth,
      });
    },
  };
  layer.draw(context, 0, 0, 36);

  assert.deepEqual(strokes, [{ color: "#ff0000", width: 3 }]);
});

test("激光从发生器沿固定方向延伸，并停在首个阻挡格", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1)
    for (let x = 0; x < 6; x += 1) entities.push(ground(x, y));
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_STONE, x: 3, y: 0 },
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

test("多发生器地图由单个激光调度器统一更新", () => {
  const entities = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 12; x += 1) entities.push(ground(x, y));
  }
  for (let x = 0; x < 12; x += 1) {
    entities.push(
      { type: MapEntityTypeId.LASER_EMITTER, direction: "down", x, y: 0 },
      { type: MapEntityTypeId.LASER_STONE, x, y: 2 },
    );
  }
  entities.push({ type: MapEntityTypeId.BOBBY, x: 0, y: 4 });
  const world = new World({
    schemaVersion: 1,
    width: 12,
    height: 5,
    entities,
  });

  assert.equal(
    world.query.entitiesMatching({
      kind: "type",
      value: RuntimeEntityTypeId.LASER_SYSTEM,
    }).length,
    1,
  );
  assert.equal(beamEntities(world).length, 24);

  const definitions = createBuiltinEntityRegistry();
  const behaviors = createBuiltinBehaviorRegistry();
  const emitterBehaviorId = definitions
    .require(MapEntityTypeId.LASER_EMITTER).behaviors[0];
  const systemBehaviorId = definitions
    .require(RuntimeEntityTypeId.LASER_SYSTEM).behaviors[0];
  assert.equal(behaviors.require(emitterBehaviorId).onTick, undefined);
  assert.equal(typeof behaviors.require(systemBehaviorId).onTick, "function");
  assert.deepEqual(
    definitions.require(MapEntityTypeId.LASER_BOMB).behaviors ?? [],
    [],
  );

  const firstUpdate = world.update({ tick: 0, stepMs: 16 });
  const secondUpdate = world.update({ tick: 1, stepMs: 16 });
  assert.equal(firstUpdate.mutations.stateChanged.length, 1);
  assert.deepEqual(secondUpdate.mutations.stateChanged, []);
});
