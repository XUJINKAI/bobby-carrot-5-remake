import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  WIND_CAMERA_FOCUS_DURATION_MS,
} from "../dist/entities/original/wind-switch.js";
import { CLOUD_MOVEMENT } from "../dist/entities/movement/MovementCadence.js";
import { CAMERA_FOLLOW_STEP_MS } from "../dist/render/Camera.js";
import { World } from "./support/World.mjs";

const ORIGINAL_GAMEPLAY_STEP_MS = CAMERA_FOLLOW_STEP_MS;

function move(world, actorId, direction) {
  return world.step({
    intents: [{
      type: "move",
      actorId,
      direction,
      cause: { type: "player-input" },
    }],
  });
}

function windWorld(active) {
  return new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 1,
        y: 0,
        direction: "right",
        active,
      },
      { type: MapEntityTypeId.WINDMILL, x: 3, y: 0, direction: "right" },
    ],
  }, { motionDurationMs: 100 });
}

test("开启 Wind Switch 后等待全局 Camera 行程，再聚焦 Windmill 约 64 个原版 step", () => {
  const world = windWorld(false);
  const actor = world.query.entitiesWithFact("player")[0];
  const windmill = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WINDMILL,
  })[0];
  const windSwitch = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  })[0];
  assert.ok(actor && windmill && windSwitch);

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  world.update({ tick: 1, stepMs: 100 });
  assert.equal(world.entity(windSwitch.id).state.active, true);
  assert.equal(world.cameraTarget, windmill.id);
  assert.equal(world.isInputBlockedFor(actor.id), true);
  assert.equal(world.actions.active[0].state.phase, "travel");
  assert.equal(world.entity(windSwitch.id).state.windPending, true);

  let tick = 2;
  while (world.entity(windSwitch.id).state.windPending === true) {
    world.update({
      tick,
      stepMs: ORIGINAL_GAMEPLAY_STEP_MS,
    });
    assert.equal(world.cameraTarget, windmill.id);
    tick += 1;
  }
  assert.equal(world.actions.active[0].state.phase, "hold");

  const holdSteps = WIND_CAMERA_FOCUS_DURATION_MS / ORIGINAL_GAMEPLAY_STEP_MS;
  for (let step = 0; step < holdSteps; step += 1) {
    world.update({ tick, stepMs: ORIGINAL_GAMEPLAY_STEP_MS });
    tick += 1;
  }
  assert.equal(world.cameraTarget, null);
  assert.equal(world.isInputBlockedFor(actor.id), false);
});

test("Camera 抵达 Windmill 前 Cloud 不接受刚开启的风向", () => {
  const entities = [
    { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
    { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    {
      type: MapEntityTypeId.WIND_SWITCH,
      x: 1,
      y: 0,
      direction: "right",
      active: false,
    },
    { type: MapEntityTypeId.WINDMILL, x: 3, y: 1, direction: "right" },
    { type: MapEntityTypeId.CLOUD, x: 4, y: 1, color: "red" },
    ...Array.from({ length: 7 }, (_, x) => ({
      type: MapEntityTypeId.STARFIELD,
      x,
      y: 1,
      variant: "large-star",
    })),
  ];
  const world = new World({
    schemaVersion: 1,
    width: 7,
    height: 2,
    entities,
  }, { motionDurationMs: 100 });
  const actor = world.query.entitiesWithFact("player")[0];
  const windSwitch = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  })[0];
  const cloud = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.CLOUD,
  })[0];
  assert.ok(actor && windSwitch && cloud);

  move(world, actor.id, "right");
  let tick = 1;
  world.update({ tick, stepMs: 100 });
  tick += 1;
  while (world.entity(windSwitch.id).state.windPending === true) {
    const result = world.update({ tick, stepMs: ORIGINAL_GAMEPLAY_STEP_MS });
    assert.equal(
      result.motions.some((motion) => motion.entityId === cloud.id),
      false,
    );
    assert.deepEqual(world.entity(cloud.id).anchor, { x: 4, y: 1 });
    tick += 1;
  }

  const result = world.update({ tick, stepMs: 416 });
  const cloudMotion = result.motions.find(
    (motion) => motion.entityId === cloud.id,
  );
  assert.ok(cloudMotion);
  assert.ok(
    Math.abs(cloudMotion.durationMs - CLOUD_MOVEMENT.cellMs) <= 0.001,
  );
  tick += 1;
  world.update({ tick, stepMs: ORIGINAL_GAMEPLAY_STEP_MS });
  assert.equal(world.cameraTarget, cloud.id);
  assert.equal(world.actions.active[0].state.elapsedHoldMs, 0);
});

test("关闭 Wind Switch 只关闭对应方向且不聚焦 Camera", () => {
  const world = windWorld(true);
  const actor = world.query.entitiesWithFact("player")[0];
  const windSwitch = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  })[0];
  assert.ok(actor && windSwitch);

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  world.update({ tick: 1, stepMs: 100 });
  assert.equal(world.entity(windSwitch.id).state.active, false);
  assert.equal(world.cameraTarget, null);
  assert.equal(world.actions.active.length, 0);
});
