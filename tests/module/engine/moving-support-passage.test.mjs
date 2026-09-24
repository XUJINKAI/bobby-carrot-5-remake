import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { CLOUD_MOVEMENT } from "../../../engine/dist/entities/movement/MovementCadence.js";
import { CommandQueue } from "../../../engine/dist/world/behavior/CommandQueue.js";
import { World } from "../../support/engine/World.mjs";

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

test("Leaf stops before an occupied water cell", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
      { type: MapEntityTypeId.CRUMBLY_ROCK, x: 2, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const bobby = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF })[0];

  assert.equal(move(world, bobby.id, "right").moves[0].moved, true);
  world.update({ tick: 1, stepMs: CLOUD_MOVEMENT.cellMs });

  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(leaf.id).state?.moving, false);
  assert.equal(world.actions.active.length, 0);
});

test("Leaf 可经过覆盖水面的 Beanstalk", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: MapEntityTypeId.WATER, x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.TIDE, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.LEAF, x: 0, y: 0, stackOrder: 1 },
      { type: MapEntityTypeId.BEANSTALK, x: 1, y: 0, stackOrder: 1 },
    ],
  });
  const leaf = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LEAF,
  })[0];

  world.update({ tick: 1, stepMs: 1 });
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });

  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(leaf.id).state?.moving, true);
});

test("Cloud stops before Plank but may enter Cloud Grid infrastructure", () => {
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
      { type: MapEntityTypeId.PLANK, x: 2, y: 0 },
      { type: MapEntityTypeId.CLOUD_PARKING, x: 3, y: 0, color: "red" },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const cloud = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.CLOUD })[0];
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });

  assert.deepEqual(world.entity(cloud.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(cloud.id).state?.moving, false);
});

test("Cloud Grid does not count as support occupancy", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, x: 0, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 1, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.STARFIELD, x: 2, y: 0, variant: "large-star" },
      { type: MapEntityTypeId.WINDMILL, x: 0, y: 0, direction: "right" },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        direction: "right",
        active: true,
      },
      { type: MapEntityTypeId.CLOUD, x: 1, y: 0, color: "red" },
      { type: MapEntityTypeId.CLOUD_PARKING, x: 2, y: 0, color: "red" },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const cloud = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.CLOUD })[0];
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });

  assert.deepEqual(world.entity(cloud.id).anchor, { x: 2, y: 0 });
});

test("Wind 推动的同向 Cloud 在前方 Cloud 停下后保持分格", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        ...[0, 1, 2, 3].map((x) => ({
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
        { type: MapEntityTypeId.CLOUD, x: 2, y: 0, color: "purple" },
      ],
    },
    { motionDurationMs: 350 },
  );
  const clouds = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.CLOUD,
  });

  for (let tick = 1; tick <= 50; tick += 1)
    world.update({ tick, stepMs: 50 });

  assert.deepEqual(world.entity(clouds[0].id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(clouds[1].id).anchor, { x: 3, y: 0 });
});

test("Cloud 可经过天空中的 Carrot，并在转向受阻后沿原方向续行", () => {
  const entities = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1)
      entities.push({ type: MapEntityTypeId.STARFIELD, x, y, variant: "large-star" });
  }
  entities.push(
    { type: MapEntityTypeId.WINDMILL, x: 0, y: 1, direction: "right" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 0, y: 1, direction: "right", active: true },
    { type: MapEntityTypeId.WINDMILL, x: 2, y: 3, direction: "up" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 2, y: 3, direction: "up", active: true },
    { type: MapEntityTypeId.CLOUD, x: 1, y: 1, color: "red" },
    { type: MapEntityTypeId.CARROT, x: 2, y: 1 },
    { type: MapEntityTypeId.PLANK, x: 2, y: 0 },
  );
  const world = new World({ schemaVersion: 1, width: 4, height: 4, entities });
  const cloud = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.CLOUD })[0];

  world.update({ tick: 1, stepMs: 1 });
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 2, y: 1 });
  world.update({ tick: 3, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 3, y: 1 });
});

test("Cloud 在交叉风区逐个尝试可通行的风向", () => {
  const entities = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1)
      entities.push({ type: MapEntityTypeId.STARFIELD, x, y, variant: "large-star" });
  }
  entities.push(
    { type: MapEntityTypeId.WINDMILL, x: 2, y: 4, direction: "up" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 2, y: 4, direction: "up", active: true },
    { type: MapEntityTypeId.WINDMILL, x: 4, y: 2, direction: "left" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 4, y: 2, direction: "left", active: true },
    { type: MapEntityTypeId.PLANK, x: 2, y: 1 },
    { type: MapEntityTypeId.CLOUD, x: 2, y: 2, color: "red" },
  );
  const world = new World({ schemaVersion: 1, width: 5, height: 5, entities });
  const cloud = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.CLOUD })[0];

  world.update({ tick: 1, stepMs: 1 });
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 1, y: 2 });
});

test("Cloud 进入交叉风区时独立检查逆风", () => {
  const entities = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1)
      entities.push({ type: MapEntityTypeId.STARFIELD, x, y, variant: "large-star" });
  }
  entities.push(
    { type: MapEntityTypeId.WINDMILL, x: 0, y: 1, direction: "right" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 0, y: 1, direction: "right", active: true },
    { type: MapEntityTypeId.WINDMILL, x: 2, y: 3, direction: "up" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 2, y: 3, direction: "up", active: true },
    { type: MapEntityTypeId.WINDMILL, x: 5, y: 1, direction: "left" },
    { type: MapEntityTypeId.WIND_SWITCH, x: 5, y: 1, direction: "left", active: true },
    { type: MapEntityTypeId.CLOUD, x: 1, y: 1, color: "red" },
  );
  const world = new World({ schemaVersion: 1, width: 6, height: 4, entities });
  const cloud = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.CLOUD })[0];

  world.update({ tick: 1, stepMs: 1 });
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(cloud.id).anchor, { x: 1, y: 1 });
});

test("初始位于潮流上的 Leaf 自动漂流，普通水面上的 Leaf 保持静止", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 2,
    entities: [
      ...[0, 1, 2, 3].flatMap((x) => [
        { type: MapEntityTypeId.WATER, x, y: 0 },
        { type: MapEntityTypeId.WATER, x, y: 1 },
      ]),
      { type: MapEntityTypeId.TIDE, x: 1, y: 0, direction: "right" },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
      { type: MapEntityTypeId.LEAF, x: 1, y: 1 },
    ],
  });
  const leaves = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF });

  world.update({ tick: 1, stepMs: 1 });
  assert.equal(world.actions.active.length, 1);
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(leaves[0].id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(leaves[1].id).anchor, { x: 1, y: 1 });
});

test("Tide 推动的 Leaf 会被刚刚停下的同向 Leaf 阻挡", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        ...[0, 1, 2, 3].map((x) => ({
          type: MapEntityTypeId.WATER,
          x,
          y: 0,
        })),
        { type: MapEntityTypeId.TIDE, x: 0, y: 0, direction: "right" },
        { type: MapEntityTypeId.LEAF, x: 0, y: 0, stackOrder: 1 },
        { type: MapEntityTypeId.LEAF, x: 1, y: 0, stackOrder: 1 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, stackOrder: 2 },
      ],
    },
    { motionDurationMs: 350 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  const leaves = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LEAF,
  });

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  for (let tick = 1; tick <= 50; tick += 1)
    world.update({ tick, stepMs: 50 });

  assert.deepEqual(world.entity(leaves[0].id).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.entity(leaves[1].id).anchor, { x: 3, y: 0 });
  assert.equal(world.entity(leaves[0].id).state?.moving, false);
  assert.equal(world.entity(leaves[1].id).state?.moving, false);
});

test("Leaf 顺流改向受阻时沿原方向续行", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 3,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 1 },
      ...[1, 2, 3].map((x) => ({ type: MapEntityTypeId.WATER, x, y: 1 })),
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.TIDE, x: 2, y: 1, direction: "up" },
      { type: MapEntityTypeId.FENCE, variant: "ts-16-10", x: 2, y: 0 },
      { type: MapEntityTypeId.LEAF, x: 1, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF })[0];

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  for (let tick = 1; tick <= 3; tick += 1)
    world.update({ tick, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 3, y: 1 });
});

test("停在潮流上的 Leaf 会在前方清空后继续漂流", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.TIDE, x: 1, y: 0, direction: "right" },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 2, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const leaf = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.LEAF })[0];
  const plank = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.PLANK })[0];

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  world.update({ tick: 1, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 0 });
  assert.equal(world.actions.active.length, 1);

  const commands = new CommandQueue();
  commands.destroy(plank.id);
  world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 2, y: 0 });
});

test("初始位于向左潮流上的 Leaf 前方受阻时原地等待", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: MapEntityTypeId.WATER, x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.WATER, x: 2, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 0, y: 0 },
      { type: MapEntityTypeId.TIDE, x: 1, y: 0, direction: "left" },
      { type: MapEntityTypeId.LEAF, x: 1, y: 0 },
    ],
  });
  const leaf = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LEAF,
  })[0];
  const plank = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.PLANK,
  })[0];

  world.update({ tick: 1, stepMs: 1 });
  world.update({ tick: 2, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(leaf.id).state?.moving, false);
  assert.equal(world.actions.active.length, 1);

  const commands = new CommandQueue();
  commands.destroy(plank.id);
  world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });
  world.update({ tick: 3, stepMs: CLOUD_MOVEMENT.cellMs });
  assert.deepEqual(world.entity(leaf.id).anchor, { x: 0, y: 0 });
});
