import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });
const ice = (x, y) => ({ type: MapEntityTypeId.ICE, x, y });

function actorIds(world) {
  return world.query.entitiesWithTrait("player").map((entity) => entity.id);
}

function move(world, actorId, direction) {
  return world.step({
    historyBoundary: true,
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

function advance(world, count, startTick = 0, stepMs = 50) {
  let result = null;
  for (let index = 0; index < count; index += 1)
    result = world.update({ tick: startTick + index, stepMs });
  return result;
}

test("Ice emits semantic forced moves until Bobby leaves the Ice surface", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0, 0),
      ice(1, 0),
      ice(2, 0),
      ground(3, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = actorIds(world)[0];

  const entered = move(world, actor, "right");
  assert.equal(entered.moves[0].moved, true);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(world.inputBlocked, true);

  advance(world, 6, 0);
  assert.equal(world.entity(actor).anchor.x, 1);

  const firstSlide = advance(world, 1, 6);
  assert.equal(world.entity(actor).anchor.x, 2);
  assert.equal(firstSlide.motions.length, 1);
  assert.deepEqual(firstSlide.motions[0].cause, {
    type: "forced",
    sourceEntityId: world.presencesAt({ x: 1, y: 0 }).find((presence) => presence.traits.includes("forced-movement")).entityId,
    mechanism: "ice",
    cadenceMs: 350,
  });
  assert.equal(world.inputBlocked, true);

  const secondSlide = advance(world, 7, 7);
  assert.equal(world.entity(actor).anchor.x, 3);
  assert.equal(secondSlide.motions.length, 1);
  assert.equal(secondSlide.motions[0].cause.type, "forced");
  assert.equal(secondSlide.motions[0].cause.mechanism, "ice");
  // anchor 已离开 Ice，但连续空间过程仍需走完，期间 actor 继续 busy。
  assert.equal(world.inputBlocked, true);
  advance(world, 7, 14);
  assert.equal(world.inputBlocked, false);
});

test("Ice stops after a blocked forced move instead of looping", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0, 0),
      ice(1, 0),
      ground(2, 0),
      { type: MapEntityTypeId.ICE_BLOCK, x: 2, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = actorIds(world)[0];

  move(world, actor, "right");
  const blocked = advance(world, 7);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(blocked.moves.length, 1);
  assert.equal(blocked.moves[0].moved, false);
  assert.equal(blocked.moves[0].blocked, true);
  assert.equal(world.inputBlocked, false);

  advance(world, 14, 7);
  assert.equal(world.entity(actor).anchor.x, 1);
});

test("Ice RuntimeAction moves only the Bobby that entered it", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 2,
    entities: [
      ground(0, 0), ice(1, 0), ground(2, 0),
      ground(0, 1), ground(1, 1), ground(2, 1),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
    ],
  });
  const [sliding, stationary] = actorIds(world);

  move(world, sliding, "right");
  advance(world, 7);

  assert.deepEqual(world.entity(sliding).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(stationary).anchor, { x: 0, y: 1 });
});

test("Ice inherits the cadence of the movement that entered it", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        ground(0, 0),
        ice(1, 0),
        ground(2, 0),
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 248 },
  );
  const actor = actorIds(world)[0];

  move(world, actor, "right");
  let slide = null;
  for (let tick = 0; tick < 6 && !slide; tick += 1) {
    const result = world.update({ tick, stepMs: 62 });
    if (result.motions.length > 0) slide = result;
  }

  assert.ok(slide);
  assert.equal(slide.motions[0].cause.mechanism, "ice");
  assert.equal(slide.motions[0].cause.cadenceMs, 248);
});
