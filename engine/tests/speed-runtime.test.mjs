import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  DEFAULT_SPEED_CONTINUATION_CELLS,
  DEFAULT_SPEED_FULL_CADENCE_MS,
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

test("Speed keeps one fast cadence for exactly three off-belt cells", () => {
  const world = straightWorld();
  const actor = actorIds(world)[0];
  assert.equal(move(world, actor, "right").moves[0].moved, true);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(world.inputBlocked, true);

  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  assert.equal(first.result.motions[0].cause.mechanism, "speed");
  assert.equal(
    first.result.motions[0].cause.cadenceMs,
    DEFAULT_SPEED_FULL_CADENCE_MS,
  );
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "full",
  });

  const second = nextMotion(world, first.nextTick);
  assert.equal(world.entity(actor).anchor.x, 3);
  assert.equal(
    second.result.motions[0].cause.cadenceMs,
    DEFAULT_SPEED_FULL_CADENCE_MS,
  );
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "full",
  });

  const third = nextMotion(world, second.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(
    third.result.motions[0].cause.cadenceMs,
    DEFAULT_SPEED_FULL_CADENCE_MS,
  );
  assert.deepEqual(world.entity(actor).state.speedBoost, {
    direction: "right",
    phase: "full",
  });

  finishAction(world, third.nextTick);
  assert.equal(world.entity(actor).anchor.x, 4);
  assert.equal(world.entity(actor).state.speedBoost, undefined);
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
  assert.equal(
    second.result.motions[0].cause.cadenceMs,
    DEFAULT_SPEED_FULL_CADENCE_MS,
  );
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
  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);

  assert.equal(observe(world, actor, "right"), "retry");
  const third = nextMotion(world, second.nextTick);
  assert.equal(third.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);

  assert.equal(observe(world, actor, "right"), "retry");
  const fourth = nextMotion(world, third.nextTick);
  assert.equal(fourth.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
  assert.equal(world.entity(actor).anchor.x, 5);
});

test("other-direction input does not cancel the fixed continuation", () => {
  const world = straightWorld(8);
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  const first = nextMotion(world);
  assert.equal(observe(world, actor, "up"), "retry");

  const second = nextMotion(world, first.nextTick);
  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
  assert.equal(world.entity(actor).state.speedBoost.phase, "full");
});

test("same-direction input while still on the Speed surface does not pre-arm off-belt sustain", () => {
  const world = straightWorld();
  const actor = actorIds(world)[0];
  move(world, actor, "right");

  assert.equal(observe(world, actor, "right"), "retry");
  const first = nextMotion(world);
  assert.equal(world.entity(actor).anchor.x, 2);
  assert.equal(first.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);

  const second = nextMotion(world, first.nextTick);
  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
});

test("blocked Speed forced movement emits impact and clears the boost", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ...Array.from({ length: 4 }, (_, x) => ground(x, 0)),
      speed(1, 0),
      { type: EntityTypeId.WINDMILL_UP, x: 2, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
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
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: EntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
    ],
  });
  const [boosted, other] = actorIds(world);
  move(world, boosted, "right");
  const first = nextMotion(world);

  assert.equal(observe(world, other, "right"), "retry");
  const second = nextMotion(world, first.nextTick);

  assert.equal(second.result.motions[0].cause.cadenceMs, DEFAULT_SPEED_FULL_CADENCE_MS);
  assert.equal(world.entity(boosted).state.speedBoost.phase, "full");
  assert.equal(world.entity(other).state?.speedBoost, undefined);
  assert.deepEqual(world.entity(other).anchor, { x: 0, y: 1 });
});

test("Speed exports the original continuation length", () => {
  assert.equal(DEFAULT_SPEED_CONTINUATION_CELLS, 3);
});
