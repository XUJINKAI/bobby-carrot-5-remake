import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  DEFAULT_SPEED_CONTINUATION_CELLS,
} from "../dist/entities/original/speed.js";
import {
  SPEED_MOVEMENT,
} from "../dist/entities/movement/MovementCadence.js";
import { World } from "./support/World.mjs";

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });
const speed = (x, y, direction = "right") => ({
  type: MapEntityTypeId.SPEED,
  x,
  y,
  direction,
});

function actorIds(world) {
  return world.query.entitiesWithFact("player").map((entity) => entity.id);
}

function playerIntent(actorId, direction) {
  return {
    type: "move",
    actorId,
    direction,
    cause: { type: "player-input", source: "test" },
  };
}

function move(world, actorId, direction, source = "test") {
  return world.step({
    historyBoundary: true,
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input", source },
      },
    ],
  });
}

function observe(world, actorId, direction) {
  return world.actions.observeIntents(
    [playerIntent(actorId, direction)],
    world.query,
  );
}

function nextMotion(world, startTick = 0, stepMs = 50, limit = 40) {
  for (let index = 0; index < limit; index += 1) {
    const result = world.update({ tick: startTick + index, stepMs });
    if (result.motions.length > 0)
      return { result, nextTick: startTick + index + 1 };
  }
  assert.fail("expected a Speed motion");
}

function finishAction(world, startTick = 0, stepMs = 50, limit = 40) {
  for (let index = 0; index < limit; index += 1) {
    const result = world.update({ tick: startTick + index, stepMs });
    if (!world.inputBlocked)
      return { result, nextTick: startTick + index + 1 };
  }
  assert.fail("expected Speed action to complete");
}

function assertQuantizedSpeedCadence(cadenceMs, stepMs = 50) {
  assert.ok(
    Math.abs(cadenceMs - SPEED_MOVEMENT.full.cellMs) <= stepMs / 2 + 0.01,
    `expected ${cadenceMs}ms to represent the ${SPEED_MOVEMENT.full.cellMs}ms cadence`,
  );
}

function straightWorld(width = 6) {
  return new World({
    schemaVersion: 1,
    width,
    height: 1,
    entities: [
      ...Array.from({ length: width }, (_, x) => ground(x, 0)),
      speed(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
}

function measureContinuousSpeedDuration(hz, cellCount) {
  const width = cellCount + 2;
  const world = new World({
    schemaVersion: 1,
    width,
    height: 1,
    entities: [
      ...Array.from({ length: width }, (_, x) => ground(x, 0)),
      ...Array.from({ length: cellCount + 1 }, (_, index) =>
        speed(index + 1, 0)
      ),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const stepMs = 1000 / hz;
  let elapsedMs = 0;
  let startedAtMs = null;
  let speedMotionCount = 0;
  for (let tick = 0; tick < 10_000; tick += 1) {
    const result = world.update({ tick, stepMs });
    elapsedMs += stepMs;
    speedMotionCount += result.motions.filter(
      (motion) => motion.cause.mechanism === "speed",
    ).length;
    if (startedAtMs === null && speedMotionCount > 0)
      startedAtMs = elapsedMs;
    if (
      speedMotionCount === cellCount &&
      world.movement.motions.forEntity(actor)?.status !== "running"
    ) {
      assert.notEqual(startedAtMs, null);
      return elapsedMs - startedAtMs;
    }
  }
  assert.fail(`Speed 在 ${hz}Hz 下未完成 ${cellCount} 格`);
}

test("Speed 在不同 World Hz 下保持 100 格平均 cadence", () => {
  const cellCount = 100;
  const expectedMs = cellCount * SPEED_MOVEMENT.full.cellMs;
  for (const hz of [30, 60, 120]) {
    const actualMs = measureContinuousSpeedDuration(hz, cellCount);
    assert.ok(
      Math.abs(actualMs - expectedMs) <= 1000 / hz + 0.01,
      `${hz}Hz: expected ${expectedMs}ms, got ${actualMs}ms`,
    );
  }
});

test("Speed 未续按时前两格保持快速，最后一格恢复普通速度", () => {
  const world = straightWorld();
  const actor = actorIds(world)[0];
  world.entities.require(actor).state = { locomotionMoveMs: 350 };
  assert.equal(move(world, actor, "right").moves[0].moved, true);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(world.inputBlocked, true);

  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  assert.equal(first.result.motions[0].cause.mechanism, "speed");
  assertQuantizedSpeedCadence(first.result.motions[0].cause.cadenceMs);
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "full",
  });

  const second = nextMotion(world, first.nextTick);
  assert.equal(world.entity(actor).anchor.x, 3);
  assertQuantizedSpeedCadence(second.result.motions[0].cause.cadenceMs);
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "full",
  });

  const third = nextMotion(world, second.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(third.result.motions[0].cause.cadenceMs, undefined);
  assert.equal(world.movement.motions.forEntity(actor).durationMs, 350);
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "normal",
  });

  finishAction(world, third.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(world.entity(actor).state.speedBoost, undefined);
});

test("Bobby starts moving in the Speed direction when the level begins", () => {
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 1,
    entities: [
      ...Array.from({ length: 5 }, (_, x) => ground(x, 0)),
      speed(0, 0, "right"),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "left" },
    ],
  });
  const actor = actorIds(world)[0];

  assert.equal(world.inputBlocked, true);
  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(first.result.motions[0].cause.mechanism, "speed");
  assert.equal(first.result.motions[0].direction, "right");
});

test("same-direction held input renews the three-cell continuation", () => {
  const world = straightWorld(8);
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  assert.equal(observe(world, actor, "right"), "retry");

  const second = nextMotion(world, first.nextTick);
  assert.equal(world.entity(actor).anchor.x, 3);
  assertQuantizedSpeedCadence(second.result.motions[0].cause.cadenceMs);
  assert.equal(world.entity(actor).state.speedBoost.phase, "full");

  const third = nextMotion(world, second.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  const fourth = nextMotion(world, third.nextTick);
  assert.equal(world.entity(actor).anchor.x, 5);
  finishAction(world, fourth.nextTick);
  assert.equal(world.entity(actor).state.speedBoost, undefined);
});

test("held same-direction input can renew Speed on every cell", () => {
  const world = straightWorld(9);
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const first = nextMotion(world);
  assert.equal(observe(world, actor, "right"), "retry");
  const second = nextMotion(world, first.nextTick);
  assertQuantizedSpeedCadence(second.result.motions[0].cause.cadenceMs);

  assert.equal(observe(world, actor, "right"), "retry");
  const third = nextMotion(world, second.nextTick);
  assertQuantizedSpeedCadence(third.result.motions[0].cause.cadenceMs);

  assert.equal(observe(world, actor, "right"), "retry");
  const fourth = nextMotion(world, third.nextTick);
  assertQuantizedSpeedCadence(fourth.result.motions[0].cause.cadenceMs);
  assert.equal(world.entity(actor).anchor.x, 5);
});

test("other-direction input does not cancel the fixed continuation", () => {
  const world = straightWorld(8);
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const first = nextMotion(world);
  assert.equal(observe(world, actor, "up"), "retry");

  const second = nextMotion(world, first.nextTick);
  assertQuantizedSpeedCadence(second.result.motions[0].cause.cadenceMs);
  assert.equal(world.entity(actor).state.speedBoost.phase, "full");
});

test("same-direction input while still on the Speed surface does not pre-arm off-belt sustain", () => {
  const world = straightWorld();
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  assert.equal(observe(world, actor, "right"), "retry");
  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  assertQuantizedSpeedCadence(first.result.motions[0].cause.cadenceMs);

  const second = nextMotion(world, first.nextTick);
  assertQuantizedSpeedCadence(second.result.motions[0].cause.cadenceMs);
});

test("blocked Speed forced movement emits impact and clears the boost", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ...Array.from({ length: 4 }, (_, x) => ground(x, 0)),
      speed(1, 0),
      { type: MapEntityTypeId.WINDMILL, x: 2, y: 0, direction: "up" },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  let tick = 0;
  let sawBlockedAttempt = false;
  let impact = null;
  for (; tick < 20 && !impact; tick += 1) {
    const result = world.update({ tick, stepMs: 50 });
    if (result.moves.some((item) => item.blocked)) sawBlockedAttempt = true;
    impact = result.events.find((event) => event.type === "speed-impact") ?? null;
  }

  assert.equal(sawBlockedAttempt, true);
  assert.ok(impact);
  assert.equal(impact.entityId, actor);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(world.entity(actor).state.speedBoost, undefined);
  assert.equal(world.inputBlocked, false);
});

test("Speed boost state and observed input belong only to the owning Bobby", () => {
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities: [
      ...Array.from({ length: 6 }, (_, x) => ground(x, 0)),
      ...Array.from({ length: 6 }, (_, x) => ground(x, 1)),
      speed(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
    ],
  });
  const [boosted, other] = actorIds(world);
  move(world, boosted, "right");
  const first = nextMotion(world);

  assert.equal(observe(world, other, "right"), "retry");
  const second = nextMotion(world, first.nextTick);

  assertQuantizedSpeedCadence(second.result.motions[0].cause.cadenceMs);
  assert.equal(world.entity(boosted).state.speedBoost.phase, "full");
  assert.equal(world.entity(other).state?.speedBoost, undefined);
  assert.deepEqual(world.entity(other).anchor, { x: 0, y: 1 });
});

test("Speed exports the original continuation length", () => {
  assert.equal(DEFAULT_SPEED_CONTINUATION_CELLS, 3);
});

test("Speed hands off on the same tick that the entering motion completes", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        ...Array.from({ length: 4 }, (_, x) => ground(x, 0)),
        speed(1, 0),
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 350 },
  );
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  let chained = null;
  for (let tick = 0; tick < 7; tick += 1) {
    const result = world.update({ tick, stepMs: 50 });
    if (result.motions.some((motion) => motion.cause.mechanism === "speed"))
      chained = result;
  }
  assert.ok(chained);
  assert.deepEqual(world.entity(actor).anchor, { x: 2, y: 0 });
  assert.equal(world.movement.motions.forEntity(actor).status, "running");
});
