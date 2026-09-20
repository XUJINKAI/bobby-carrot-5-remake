import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  CLOUD_MOVEMENT,
} from "../dist/entities/movement/MovementCadence.js";
import { World } from "./support/World.mjs";

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

function measureCloudDuration(hz, cellCount) {
  const width = cellCount + 2;
  const world = new World({
    schemaVersion: 1,
    width,
    height: 1,
    entities: [
      ...Array.from({ length: width }, (_, x) => ({
        type: MapEntityTypeId.STARFIELD,
        x,
        y: 0,
        variant: "large-star",
      })),
      { type: MapEntityTypeId.WINDMILL, x: 0, y: 0, direction: "right" },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        direction: "right",
        active: true,
      },
      { type: MapEntityTypeId.CLOUD, x: 1, y: 0, color: "red" },
      {
        type: MapEntityTypeId.CLOUD_PARKING,
        x: cellCount + 1,
        y: 0,
        color: "red",
      },
    ],
  });
  const cloud = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.CLOUD,
  })[0];
  const stepMs = 1000 / hz;
  let elapsedMs = 0;
  let startedAtMs = null;
  let cloudMotionCount = 0;
  for (let tick = 0; tick < 10_000; tick += 1) {
    const result = world.update({ tick, stepMs });
    elapsedMs += stepMs;
    cloudMotionCount += result.motions.filter(
      (motion) => motion.cause.mechanism === "cloud",
    ).length;
    if (startedAtMs === null && cloudMotionCount > 0)
      startedAtMs = elapsedMs;
    if (
      cloudMotionCount === cellCount &&
      world.entity(cloud.id).state.moving === false
    ) {
      assert.notEqual(startedAtMs, null);
      return elapsedMs - startedAtMs;
    }
  }
  assert.fail(`Cloud 在 ${hz}Hz 下未完成 ${cellCount} 格`);
}

test("Cloud 在不同 World Hz 下保持 100 格平均 cadence", () => {
  const cellCount = 100;
  const expectedMs = cellCount * CLOUD_MOVEMENT.cellMs;
  for (const hz of [30, 60, 120]) {
    const actualMs = measureCloudDuration(hz, cellCount);
    assert.ok(
      Math.abs(actualMs - expectedMs) <= 1000 / hz + 0.01,
      `${hz}Hz: expected ${expectedMs}ms, got ${actualMs}ms`,
    );
  }
});

test("Leaf carries co-located Bobby without creating a mount relation", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 3, y: 0 },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesWithFact("moving-platform")[0];

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  assert.equal(world.entity(actor.id).state?.mountId, undefined);
  const drift = world.update({ tick: 1, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.equal(drift.motions.length, 2);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.entity(actor.id).state?.mountId, undefined);

  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.equal(world.entity(leaf.id).state.moving, false);
  assert.equal(world.actions.active.length, 0);
  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  assert.equal(world.entity(actor.id).state?.mountId, undefined);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
});

test("Leaf 上已有 Bobby 时会阻止另一个 Bobby 进入", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.WATER, x: 3, y: 0 },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.BOBBY, x: 1, y: 0, direction: "right" },
    ],
  });
  const players = world.query.entitiesWithFact("player");
  const result = move(world, players[0].id, "right");

  assert.equal(result.moves[0].moved, false);
  assert.equal(result.moves[0].passage.reason, "player-occupied");
  assert.deepEqual(world.entity(players[0].id).anchor, { x: 0, y: 0 });
  assert.deepEqual(world.entity(players[1].id).anchor, { x: 1, y: 0 });
});

test("Wind drives a Cloud through sky and matching Parking stops it", () => {
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
      { type: MapEntityTypeId.CLOUD_PARKING, x: 3, y: 0, color: "red" },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const cloud = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.CLOUD })[0] ??
    world.query.entitiesWithFact("moving-platform")[0];
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 2, y: 0 });
  world.update({ tick: 3, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 3, y: 0 });
  world.update({ tick: 4, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.equal(world.entity(cloud.id).state.moving, false);
});

test("Leaf starts moving on the same tick that a player arrives", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
        { type: MapEntityTypeId.WATER, x: 1, y: 0 },
        { type: MapEntityTypeId.WATER, x: 2, y: 0 },
        { type: MapEntityTypeId.WATER, x: 3, y: 0 },
        { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 350 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF })[0];
  move(world, actor.id, "right");

  let handoff = null;
  for (let tick = 0; tick < 7; tick += 1) {
    const result = world.update({ tick, stepMs: 50 });
    if (
      result.motions.some(
        (motion) =>
          motion.entityId === leaf.id && motion.cause.mechanism === "leaf",
      )
    )
      handoff = result;
  }
  assert.ok(handoff);
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.entity(actor.id).state?.mountId, undefined);
});

test("Leaf can launch perpendicular to Tide and follows Tide after the first cell", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 3,
      entities: [
        { type: "grass", variant: "ts-10-1", x: 0, y: 1 },
        { type: MapEntityTypeId.WATER, x: 1, y: 1 },
        { type: MapEntityTypeId.WATER, x: 2, y: 1 },
        { type: MapEntityTypeId.WATER, x: 1, y: 2 },
        { type: MapEntityTypeId.WATER, x: 2, y: 2 },
        { type: MapEntityTypeId.TIDE, x: 1, y: 1, direction: "down" },
        { type: MapEntityTypeId.TIDE, x: 2, y: 1, direction: "down" },
        { type: MapEntityTypeId.LEAF, x: 1, y: 1 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF })[0];
  // 先让 Tide 建立自动漂流 Action，再从侧面登叶，覆盖真实 gameplay 时序。
  world.update({ tick: 0, stepMs: 1 });
  assert.equal(move(world, actor.id, "right").moves[0].moved, true);

  let sawPerpendicularCell = false;
  let sawRedirectedCell = false;
  for (let tick = 1; tick <= 20; tick += 1) {
    world.update({ tick, stepMs: 100 });
    const anchor = world.entity(leaf.id).anchor;
    if (anchor.x === 2 && anchor.y === 1) sawPerpendicularCell = true;
    if (anchor.x === 2 && anchor.y === 2) {
      sawRedirectedCell = true;
      break;
    }
  }

  assert.equal(sawPerpendicularCell, true);
  assert.equal(sawRedirectedCell, true);
});

test("Bobby 逆流登叶不启动该方向，潮流仍保留自动续行", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 3,
      entities: [
        { type: MapEntityTypeId.WATER, x: 1, y: 1 },
        { type: "grass", variant: "ts-10-1", x: 1, y: 2 },
        { type: MapEntityTypeId.TIDE, x: 1, y: 1, direction: "down" },
        { type: MapEntityTypeId.LEAF, x: 1, y: 1 },
        { type: MapEntityTypeId.BOBBY, x: 1, y: 2, direction: "up" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF })[0];
  assert.equal(move(world, actor.id, "up").moves[0].moved, true);

  for (let tick = 1; tick <= 4; tick += 1)
    world.update({ tick, stepMs: 50 });

  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 1 });
  assert.equal(world.entity(leaf.id).state?.moving, false);
  assert.equal(world.actions.active.length, 1);
});
