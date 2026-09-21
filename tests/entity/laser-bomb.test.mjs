import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinEntityRegistry } from "../../engine/dist/entities/registry.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
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
  assert.ok(
    resolveLevelEntityVisualPreview({ type: MapEntityTypeId.LASER_BOMB }),
  );
});

test("激光引爆炸弹后摧毁十字范围内的石头、镜面与发生器", () => {
  const entities = filledGround(5, 5);
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "down", x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.PUSHABLE_STONE, x: 1, y: 2 },
    { type: MapEntityTypeId.LASER_MIRROR, variant: "slash", x: 3, y: 2 },
    { type: MapEntityTypeId.LASER_EMITTER, direction: "down", x: 2, y: 3 },
    { type: MapEntityTypeId.PUSHABLE_STONE, x: 3, y: 1 },
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
    MapEntityTypeId.LASER_EMITTER,
  );
  const diagonalStone = entitiesOfType(
    world,
    MapEntityTypeId.PUSHABLE_STONE,
  ).find((stone) => stone.anchor.x === 3 && stone.anchor.y === 1);
  assert.ok(diagonalStone);

  world.update({ tick: 0, stepMs: 16 });

  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 0);
  assert.deepEqual(
    entitiesOfType(world, MapEntityTypeId.LASER_EMITTER).map(({ id }) => id),
    [source.id],
  );
  assert.equal(world.entity(target.id), undefined);
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_MIRROR).length, 0);
  assert.deepEqual(
    entitiesOfType(world, MapEntityTypeId.PUSHABLE_STONE).map(({ id }) => id),
    [diagonalStone.id],
  );
  assert.equal(
    entitiesOfType(world, RuntimeEntityTypeId.LASER_BEAM).some(
      (beam) => beam.state?.sourceId === target.id,
    ),
    false,
  );
});

test("相邻炸弹连锁扩展十字范围，并保留 Exit", () => {
  const entities = filledGround(5, 5);
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "down", x: 2, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 2, y: 2 },
    { type: MapEntityTypeId.LASER_BOMB, x: 3, y: 2 },
    { type: MapEntityTypeId.PUSHABLE_STONE, x: 4, y: 2 },
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

  world.update({ tick: 0, stepMs: 16 });

  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_BOMB).length, 0);
  assert.equal(entitiesOfType(world, MapEntityTypeId.PUSHABLE_STONE).length, 0);
  assert.equal(entitiesOfType(world, MapEntityTypeId.LASER_MIRROR).length, 0);
  assert.ok(world.entity(exit.id));
});
