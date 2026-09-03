import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  DEFAULT_SPEED_FULL_CADENCE_MS,
  DEFAULT_SPEED_NORMAL_CADENCE_MS,
  DEFAULT_SPEED_SLOW_CADENCE_MS,
} from "../dist/entities/original/speed.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: EntityTypeId.GROUND_C, x, y });
const speed = (x, y, direction = "right") => ({
  type: EntityTypeId.SPEED,
  x,
  y,
  direction,
});

function actorIds(world) {
  return world.query.entitiesWithTrait("player").map((entity) => entity.id);
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
  world.observeIntents([
    {
      type: "move",
      actorId,
      direction,
      cause: { type: "player-input", source: "test" },
    },
  ]);
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

function straightWorld(width = 6) {
  return new World({
    schemaVersion: 1,
    width,
    height: 1,
    entities: [
      ...Array.from({ length: width }, (_, x) => ground(x, 0)),
      speed(1, 0),
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
}

test("Speed decays full -> normal -> slow and stops on the third off-belt cell", () => {
  const world = straightWorld();
  const actor = actorIds(world)[0];
  assert.equal(move(world, actor, "right").moves[0].moved, true);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(world.inputBlocked, true);

  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  assert.equal(first.result.motions[0].cause.mechanism, "speed");
  assert.equal(first.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "full",
  });

  const second = nextMotion(world, first.nextTick);
  assert.equal(world.entity(actor).anchor.x, 3);
  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_NORMAL_CADENCE_MS);
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "normal",
  });

  const third = nextMotion(world, second.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(third.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_SLOW_CADENCE_MS);
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "slow",
  });

  finishAction(world, third.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(world.entity(actor).state.speedBoost, undefined);
});

test("one same-direction press during full Speed latches continued full speed", () => {
  const world = straightWorld(8);
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  observe(world, actor, "right");

  const second = nextMotion(world, first.nextTick);
  assert.equal(world.entity(actor).anchor.x, 3);
  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
  assert.equal(world.entity(actor).state.speedBoost.phase, "full");

  // 不再重复输入；一次 latch 足以让下一段继续保持全速。
  const third = nextMotion(world, second.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(third.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
  assert.equal(world.entity(actor).state.speedBoost.phase, "full");
});

test("other-direction input does not sustain the first off-belt full-speed segment", () => {
  const world = straightWorld();
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const first = nextMotion(world);
  observe(world, actor, "up");
  const second = nextMotion(world, first.nextTick);

  assert.equal(world.entity(actor).anchor.x, 3);
  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_NORMAL_CADENCE_MS);
  assert.equal(world.entity(actor).state.speedBoost.phase, "normal");
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
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: EntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
    ],
  });
  const [boosted, other] = actorIds(world);
  move(world, boosted, "right");
  const first = nextMotion(world);

  observe(world, other, "right");
  const second = nextMotion(world, first.nextTick);

  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_NORMAL_CADENCE_MS);
  assert.equal(world.entity(boosted).state.speedBoost.phase, "normal");
  assert.equal(world.entity(other).state.speedBoost, undefined);
  assert.deepEqual(world.entity(other).anchor, { x: 0, y: 1 });
});
