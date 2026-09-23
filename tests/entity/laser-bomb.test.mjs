import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../engine/dist/public.js";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../../engine/dist/entities/registry.js";
import {
  LASER_BOMB_IGNITION_DURATION_MS,
} from "../../engine/dist/entities/robo2/laser-bomb.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
import { VisualRuntime } from "../../engine/dist/visual/VisualRuntime.js";
import { World } from "../support/engine/World.mjs";

const ground = (x, y) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y,
});

function filledGround(width, height) {
  const entities = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      entities.push(ground(x, y));
    }
  }
  return entities;
}

function entitiesOfType(world, type) {
  return world.query.entitiesMatching({ kind: "type", value: type });
}

test("激光炸弹使用通用推动规则并提供独立视觉", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 2,
    entities: [
      ...filledGround(3, 2),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
      { type: MapEntityTypeId.LASER_BOMB, x: 1, y: 1 },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const bomb = entitiesOfType(world, MapEntityTypeId.LASER_BOMB)[0];

  const result = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input", source: "test" },
    }],
  });

  assert.equal(result.moves[0].moved, true);
  assert.deepEqual(world.entity(bomb.id).anchor, { x: 2, y: 1 });
  assert.deepEqual(
    createBuiltinEntityRegistry().require(MapEntityTypeId.LASER_BOMB)
      .presenceFacts,
    ["blocking", "pushable"],
  );
  assert.deepEqual(
    resolveLevelEntityVisualPreview({ type: MapEntityTypeId.LASER_BOMB }),
    {
      layers: [{
        kind: "image",
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.bomb,
        sourceTileSize: 12,
        anchor: "top-left",
      }],
    },
  );
});

test("激光引爆炸弹后摧毁十字范围内的石头、镜面与激光炮", () => {
  const entities = filledGround(5, 5);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.LASER_STONE, x: 1, y: 2 },
    { type: MapEntityTypeId.LASER_MIRROR, variant: "slash", x: 3, y: 2 },
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 2, y: 3 },
    { type: MapEntityTypeId.LASER_STONE, x: 3, y: 1 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 4 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 5,
    entities,
  });
  const [source, target] = entitiesOfType(
    world,
    MapEntityTypeId.LASER_CANNON,
  );
  const diagonalStone = entitiesOfType(
    world,
    MapEntityTypeId.LASER_STONE,
  ).find((stone) => stone.anchor.x === 3 && stone.anchor.y === 1);
  assert.ok(diagonalStone);

  const ignition = world.update({ tick: 0, stepMs: 16 });
  const armedBomb = entitiesOfType(world, MapEntityTypeId.LASER_BOMB)[0];
  assert.equal(armedBomb.state?.armed, true);
  assert.equal(world.inputBlocked, false);
  assert.equal(world.entity(target.id)?.type, MapEntityTypeId.LASER_CANNON);
  assert.equal(
    ignition.events.some((event) => event.type === "laser-bomb-exploded"),
    false,
  );
  assert.equal(
    ignition.events.filter((event) =>
      event.type === "laser-bomb-ignition-started"
    ).length,
    1,
  );
  const waiting = world.update({ tick: 1, stepMs: 16 });
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 1);
  assert.equal(world.entity(target.id)?.type, MapEntityTypeId.LASER_CANNON);
  assert.equal(
    waiting.events.some((event) => event.type === "laser-bomb-exploded"),
    false,
  );

  const ignitionVisual = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const ignitionStart = { frame: 1, nowMs: 1000, deltaMs: 0 };
  ignitionVisual.consumeWorldDeltas(world, ignition.deltas, ignitionStart, {
    motionDuration: () => 0,
    stationaryDeathDurationMs: 0,
  });
  ignitionVisual.update(ignitionStart, "linear");
  const ignitionTransient = ignitionVisual.scene(world).effect.find(
    (item) => item.presence.entityId < 0,
  );
  assert.deepEqual(ignitionTransient?.composition.layers.map((layer) => ({
    asset: layer.asset,
    frameWidth: layer.frameWidth,
    frameHeight: layer.frameHeight,
    frameRows: layer.frameRows,
  })), [{
    asset: ROBO2_GAMEPLAY_IMAGE_IDS.bombExplosion,
    frameWidth: 14,
    frameHeight: 14,
    frameRows: 6,
  }]);

  const result = world.update({
    tick: 2,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });

  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 0);
  assert.deepEqual(
    entitiesOfType(world, MapEntityTypeId.LASER_CANNON).map(({ id }) => id),
    [source.id],
  );
  assert.equal(world.entity(target.id), undefined);
  assert.equal(
    result.events.some((event) =>
      event.type === "laser-cannon-destroyed" && event.entityId === target.id
    ),
    false,
  );
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_MIRROR).length, 0);
  assert.deepEqual(
    entitiesOfType(world, MapEntityTypeId.LASER_STONE).map(({ id }) => id),
    [diagonalStone.id],
  );
  assert.equal(
    entitiesOfType(world, RuntimeEntityTypeId.LASER_BEAM).some(
      (beam) => beam.state?.sourceId === target.id,
    ),
    false,
  );
  const explosion = result.events.find((event) =>
    event.type === "laser-bomb-exploded"
  );
  assert.deepEqual(explosion?.data?.cells, [
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ]);

  const visual = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const start = { frame: 1, nowMs: 1000, deltaMs: 0 };
  visual.consumeWorldDeltas(world, result.deltas, start, {
    motionDuration: () => 0,
    stationaryDeathDurationMs: 0,
  });
  visual.update(start, "linear");
  const scene = visual.scene(world);
  const transient = scene.worldEffect.find(
    (item) =>
      item.presence.entityId < 0 &&
      item.composition.layers[0]?.asset === ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
  );
  assert.ok(transient);
  assert.deepEqual(
    transient.composition.layers.map((layer) => ({
      asset: layer.asset,
      frameWidth: layer.frameWidth,
      frameHeight: layer.frameHeight,
      frameRows: layer.frameRows,
      offsetX: layer.offsetX,
      offsetY: layer.offsetY,
    })),
    [
      {
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
        frameWidth: 14,
        frameHeight: 12,
        frameRows: 6,
        offsetX: 0,
        offsetY: 0,
      },
      {
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
        frameWidth: 14,
        frameHeight: 12,
        frameRows: 6,
        offsetX: 0,
        offsetY: -12,
      },
      {
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
        frameWidth: 14,
        frameHeight: 12,
        frameRows: 6,
        offsetX: 12,
        offsetY: 0,
      },
      {
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
        frameWidth: 14,
        frameHeight: 12,
        frameRows: 6,
        offsetX: 0,
        offsetY: 12,
      },
      {
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
        frameWidth: 14,
        frameHeight: 12,
        frameRows: 6,
        offsetX: -12,
        offsetY: 0,
      },
    ],
  );
  assert.equal(
    scene.worldEffect.some((item) =>
      item.presence.entityId < 0 &&
      item.composition.layers[0]?.asset ===
        ROBO2_GAMEPLAY_IMAGE_IDS.cannon.down
    ),
    false,
  );
  assert.equal(
    scene.effect.some((item) =>
      item.composition.layers[0]?.asset === ROBO2_GAMEPLAY_IMAGE_IDS.explosion
    ),
    false,
  );
  assert.equal(
    scene.standing.some((item) => item.presence.entityId > 0),
    true,
  );
});

test("炸弹十字爆炸覆盖 Bobby 所在格并将其击倒", () => {
  const entities = filledGround(5, 5);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.BOBBY, x: 3, y: 2 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 5,
    entities,
  });
  const actor = world.query.entitiesWithFact("player")[0];

  world.update({ tick: 0, stepMs: 16 });

  assert.equal(world.actorLifecycle(actor.id).phase, "active");

  const result = world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });
  const explosion = result.events.find((event) =>
    event.type === "laser-bomb-exploded"
  );

  assert.equal(world.actorLifecycle(actor.id).phase, "downed");
  assert.equal(
    world.actorLifecycle(actor.id).reason,
    "laser-bomb-explosion",
  );
  assert.deepEqual(explosion?.data?.cells, [
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ]);
});

test("相邻炸弹逐颗连锁引爆，期间 Bobby 仍可移动", () => {
  const entities = filledGround(5, 5);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.LASER_BOMB, x: 3, y: 2 },
    { type: MapEntityTypeId.LASER_STONE, x: 4, y: 2 },
    { type: MapEntityTypeId.LASER_MIRROR, variant: "backslash", x: 3, y: 1 },
    { type: MapEntityTypeId.EXIT, x: 3, y: 3 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 4 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 5,
    entities,
  });
  const exit = entitiesOfType(world, MapEntityTypeId.EXIT)[0];

  const firstIgnition = world.update({ tick: 0, stepMs: 16 });

  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 2);
  assert.equal(
    firstIgnition.events.filter((event) =>
      event.type === "laser-bomb-exploded"
    ).length,
    0,
  );
  assert.equal(world.inputBlocked, false);
  assert.deepEqual(
    entitiesOfType(world, MapEntityTypeId.LASER_BOMB)
      .map((bomb) => ({
        x: bomb.anchor.x,
        armed: bomb.state?.armed === true,
      })),
    [
      { x: 2, armed: true },
      { x: 3, armed: false },
    ],
  );
  const actor = world.query.entitiesWithFact("player")[0];
  const moved = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "left",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(moved.moves[0].moved, true);

  const firstExplosion = world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });

  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 1);
  assert.equal(
    firstExplosion.events.filter((event) =>
      event.type === "laser-bomb-exploded"
    ).length,
    1,
  );
  assert.equal(
    firstExplosion.events.filter((event) =>
      event.type === "laser-bomb-ignition-started"
    ).length,
    1,
  );

  const secondExplosion = world.update({
    tick: 2,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });

  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 0);
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_STONE).length, 0);
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_MIRROR).length, 0);
  assert.ok(world.entity(exit.id));
  assert.equal(
    secondExplosion.events.filter((event) =>
      event.type === "laser-bomb-exploded"
    ).length,
    1,
  );
});

test("分别被不同光路直接命中的炸弹同时开始起爆", () => {
  const entities = filledGround(5, 3);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 2 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 3,
    entities,
  });

  const ignition = world.update({ tick: 0, stepMs: 16 });
  assert.equal(
    ignition.events.filter((event) =>
      event.type === "laser-bomb-ignition-started"
    ).length,
    2,
  );
  assert.ok(
    entitiesOfType(world, MapEntityTypeId.LASER_BOMB).every(
      (bomb) => bomb.state?.armed === true,
    ),
  );

  world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS - 1,
  });
  const explosions = world.update({ tick: 2, stepMs: 1 });

  assert.equal(
    explosions.events.filter((event) => event.type === "laser-bomb-exploded")
      .length,
    2,
  );
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 0);
});

test("同一直线的炸弹由第一颗遮挡并在爆炸后启动第二颗", () => {
  const entities = filledGround(5, 2);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 2,
    entities,
  });

  world.update({ tick: 0, stepMs: 16 });
  assert.deepEqual(
    entitiesOfType(world, MapEntityTypeId.LASER_BOMB).map((bomb) => ({
      x: bomb.anchor.x,
      armed: bomb.state?.armed === true,
    })),
    [
      { x: 2, armed: true },
      { x: 3, armed: false },
    ],
  );

  const firstExplosion = world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });
  assert.equal(
    firstExplosion.events.filter((event) =>
      event.type === "laser-bomb-ignition-started"
    ).length,
    1,
  );
  const remainingBomb = entitiesOfType(world, MapEntityTypeId.LASER_BOMB)[0];
  assert.deepEqual(remainingBomb.anchor, { x: 3, y: 0 });
  assert.equal(remainingBomb.state?.armed, true);
});

test("前方炸弹清除后由重新投影的激光启动远处炸弹", () => {
  const entities = filledGround(6, 2);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 4, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 5, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities,
  });

  world.update({ tick: 0, stepMs: 16 });
  const firstExplosion = world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });

  assert.equal(
    firstExplosion.events.filter((event) => event.type === "laser-bomb-exploded")
      .length,
    1,
  );
  assert.equal(
    firstExplosion.events.filter((event) =>
      event.type === "laser-bomb-ignition-started"
    ).length,
    1,
  );
  const remainingBomb = entitiesOfType(world, MapEntityTypeId.LASER_BOMB)[0];
  assert.deepEqual(remainingBomb.anchor, { x: 4, y: 0 });
  assert.equal(remainingBomb.state?.armed, true);
});

test("同时爆炸的两条前沿只登记一次共同相邻炸弹", () => {
  const entities = filledGround(5, 4);
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 1, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 1, y: 1 },
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 3, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 3, y: 1 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 1 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 3 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 4,
    entities,
  });

  world.update({ tick: 0, stepMs: 16 });
  const firstWave = world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });

  assert.equal(
    firstWave.events.filter((event) => event.type === "laser-bomb-exploded")
      .length,
    2,
  );
  assert.equal(
    firstWave.events.filter((event) =>
      event.type === "laser-bomb-ignition-started"
    ).length,
    1,
  );
  const remainingBombs = entitiesOfType(world, MapEntityTypeId.LASER_BOMB);
  assert.equal(remainingBombs.length, 1);
  assert.deepEqual(remainingBombs[0].anchor, { x: 2, y: 1 });
  assert.equal(remainingBombs[0].state?.armed, true);

  const secondWave = world.update({
    tick: 2,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });
  assert.equal(
    secondWave.events.filter((event) => event.type === "laser-bomb-exploded")
      .length,
    1,
  );
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 0);
});

test("不可摧毁的障碍会截去对应方向的爆炸画面", () => {
  const entities = filledGround(5, 5).filter((entity) =>
    entity.x !== 1 || entity.y !== 2
  );
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "down", x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.STUMP, x: 1, y: 2 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 4 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 5,
    entities,
  });

  world.update({ tick: 0, stepMs: 16 });
  const result = world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS,
  });
  const explosion = result.events.find((event) =>
    event.type === "laser-bomb-exploded"
  );

  assert.deepEqual(explosion?.data?.cells, [
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ]);
});
