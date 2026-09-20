import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { GameplaySession } from "../../engine/dist/core/GameplaySession.js";
import {
  KITE_FLIGHT_MOVEMENT,
} from "../../engine/dist/entities/movement/MovementCadence.js";
import { World } from "../support/engine/World.mjs";

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

function measureFlightDuration(hz, cellCount) {
  const landingX = cellCount + 1;
  const world = new World({
    schemaVersion: 1,
    width: landingX + 1,
    height: 1,
    entities: [
      ...Array.from({ length: landingX + 1 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.LANDING, x: landingX, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "right",
      },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { kite: true };
  move(world, actor.id, "right");
  assert.equal(world.entity(actor.id).state.flying, true);

  const stepMs = 1000 / hz;
  let elapsedMs = 0;
  let launchedAtMs = null;
  for (let tick = 0; tick < 10_000; tick += 1) {
    const result = world.update({ tick, stepMs });
    elapsedMs += stepMs;
    if (
      launchedAtMs === null &&
      result.motions.some((motion) => motion.cause?.mechanism === "flight")
    ) {
      launchedAtMs = elapsedMs;
    }
    if (result.events.some((event) => event.type === "kite-landed")) {
      assert.notEqual(launchedAtMs, null);
      return elapsedMs - launchedAtMs;
    }
  }

  assert.fail(`Flight 在 ${hz}Hz 下未结束`);
}

test("Kite Flight 毫秒配置在不同 World Hz 下保持长距离速度", () => {
  assert.equal(KITE_FLIGHT_MOVEMENT.cellMs, 208);
  // 37-2 的 Whirlwind x=4 到 Landing x=86，纯飞行路径共 82 格。
  const cellCount = 82;
  const expectedMs = cellCount * KITE_FLIGHT_MOVEMENT.cellMs;

  for (const hz of [30, 60, 120]) {
    const actualMs = measureFlightDuration(hz, cellCount);
    const toleranceMs = 1000 / hz + 0.01;
    assert.ok(
      Math.abs(actualMs - expectedMs) <= toleranceMs,
      `${hz}Hz: expected ${expectedMs}ms, got ${actualMs}ms`,
    );
  }
});

test("Kite flight crosses blocking cells, ignores their interactions, and lands", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ...Array.from({ length: 4 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.ICE_BLOCK, x: 2, y: 0 },
      { type: MapEntityTypeId.TRAP, x: 2, y: 0, active: true },
      { type: MapEntityTypeId.LANDING, x: 3, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { kite: true };

  const takeoff = move(world, actor.id, "right");
  assert.equal(world.entity(actor.id).state.flying, true);
  assert.ok(takeoff.events.some((event) => event.type === "kite-airborne"));
  assert.equal(
    world.actions.observeIntents(
      [{
        type: "move",
        actorId: actor.id,
        direction: "right",
        cause: { type: "player-input" },
      }],
      world.query,
    ),
    "retry",
  );

  world.update({ tick: 1, stepMs: KITE_FLIGHT_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");

  world.update({ tick: 2, stepMs: KITE_FLIGHT_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 3, y: 0 });
  assert.equal(world.entity(actor.id).state.flying, true);
  const landing = world.update({
    tick: 3,
    stepMs: KITE_FLIGHT_MOVEMENT.cellMs,
  });
  assert.equal(world.entity(actor.id).state.flying, false);
  assert.ok(landing.events.some((event) => event.type === "kite-landed"));
  assert.ok(
    landing.events.some(
      (event) =>
        event.type === "forced-movement-impact" &&
        event.data?.mechanism === "flight-landing",
    ),
  );
  assert.equal(world.actions.active.length, 0);
});

test("Landing 完成后以 Bobby 普通 cadence 自动向前续行一格", () => {
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 1,
    entities: [
      ...Array.from({ length: 5 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.LANDING, x: 3, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { kite: true };
  move(world, actor.id, "right");
  world.entities.require(actor.id).state = {
    ...world.entity(actor.id).state,
    locomotionMoveMs: 420,
  };

  world.update({ tick: 1, stepMs: KITE_FLIGHT_MOVEMENT.cellMs });
  world.update({ tick: 2, stepMs: KITE_FLIGHT_MOVEMENT.cellMs });
  const landing = world.update({
    tick: 3,
    stepMs: KITE_FLIGHT_MOVEMENT.cellMs,
  });

  assert.ok(landing.events.some((event) => event.type === "kite-landed"));
  assert.equal(
    landing.events.some((event) => event.type === "forced-movement-impact"),
    false,
  );
  assert.deepEqual(world.entity(actor.id).anchor, { x: 4, y: 0 });
  assert.equal(world.entity(actor.id).state.flying, false);
  const runout = world.movement.motions.forEntity(actor.id);
  assert.equal(runout.cause.mechanism, "flight-landing");
  assert.equal(runout.cause.cadenceMs, undefined);
  assert.equal(runout.durationMs, 420);

  world.update({ tick: 4, stepMs: 420 });
  assert.equal(world.inputBlocked, false);
});

test("持续方向在 Landing 续步期间等待，完成后恢复普通移动", () => {
  const session = new GameplaySession({
    timing: { worldHz: 4 },
    bobbyLocomotion: { moveMs: KITE_FLIGHT_MOVEMENT.cellMs },
  });
  session.loadLevel({
    schemaVersion: 1,
    width: 6,
    height: 1,
    entities: [
      ...Array.from({ length: 6 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.LANDING, x: 3, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = session.world.query.entitiesWithFact("player")[0];
  session.world.entities.require(actor.id).state = { kite: true };

  const ticks = session.advanceTicks(12, () => ({
    moves: [{ source: "external", direction: "right" }],
  }));
  const landingTick = ticks.find((tick) =>
    tick.result.events.some((event) => event.type === "kite-landed")
  );

  assert.ok(landingTick);
  assert.equal(
    ticks.some((tick) =>
      tick.inputResolutions.some((resolution) => resolution.result === "busy")
    ),
    true,
  );
  assert.equal(
    landingTick.inputResolutions.find((item) => item.source === "external")?.result,
    "busy",
  );
  assert.ok(
    landingTick.result.motions.some(
      (motion) => motion.cause.mechanism === "flight-landing",
    ),
  );
  assert.deepEqual(session.world.entity(actor.id).anchor, { x: 5, y: 0 });
});

test("Whirlwind without Kite blocks and emits a missing-item event", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const whirlwind = world.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.WHIRLWIND);
  assert.ok(whirlwind);
  const result = move(world, actor.id, "right");
  assert.equal(result.moves[0].moved, false);
  assert.deepEqual(
    result.events.find((event) => event.type === "missing-item"),
    {
      type: "missing-item",
      actorId: actor.id,
      entityId: whirlwind.id,
      x: 1,
      y: 0,
      data: { item: "kite" },
    },
  );
});

test("Airborne movement chains without a stationary World tick", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 8,
      height: 1,
      entities: [
        ...Array.from({ length: 8 }, (_, x) => ({
          type: "grass",
          variant: "ts-10-1",
          x,
          y: 0,
        })),
        { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
        {
          type: MapEntityTypeId.BOBBY,
          x: 0,
          y: 0,
          direction: "right",
          state: { kite: true },
        },
      ],
    },
    { motionDurationMs: 350 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { kite: true };
  move(world, actor.id, "right");

  let airborne = false;
  let observedFlightMotion = false;
  for (let tick = 0; tick < 20; tick += 1) {
    world.update({ tick, stepMs: 50 });
    airborne ||= world.entity(actor.id).state?.flying === true;
    if (!airborne) continue;
    const motion = world.movement.motions.forEntity(actor.id);
    if (motion?.cause.mechanism === "flight") observedFlightMotion = true;
    if (observedFlightMotion)
      assert.equal(motion?.status, "running", `stationary at tick ${tick}`);
  }
  assert.equal(observedFlightMotion, true);
});

test("Flight boundary leaves the actor in a coherent grounded state", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ...Array.from({ length: 3 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { kite: true };
  move(world, actor.id, "right");
  world.update({ tick: 1, stepMs: KITE_FLIGHT_MOVEMENT.cellMs });
  const boundary = world.update({
    tick: 2,
    stepMs: KITE_FLIGHT_MOVEMENT.cellMs,
  });

  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.entity(actor.id).state.flying, false);
  assert.equal(world.actions.active.length, 0);
  assert.ok(
    boundary.events.some(
      (event) =>
        event.type === "flight-path-invalid" && event.reason === "void",
    ),
  );
});

test("Downing an airborne actor cancels flight and clears flight state", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ...Array.from({ length: 3 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { kite: true };
  move(world, actor.id, "right");

  const downed = world.downActor(actor.id, "test-down");
  assert.equal(world.entity(actor.id).state.flying, false);
  assert.equal(world.actions.active.length, 0);
  assert.ok(
    downed.deltas.some(
      (delta) =>
        delta.type === "action-cancelled" &&
        delta.reason === "owner-inactive",
    ),
  );
});
