import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { RuntimeEntityTypeId } from "../dist/entities/runtime-types.js";
import { DEFAULT_DRAGON_WINDUP_MS } from "../dist/entities/original/dragon.js";
import { DEFAULT_FIREBALL_CELL_MS } from "../dist/entities/original/fireball.js";
import { World } from "./support/World.mjs";

function update(world, tick, stepMs) {
  return world.update({ tick, stepMs });
}

test("Dragon Fireball moves through World cells, melts Ice, and reflects", () => {
  const entities = [];
  for (let y = 0; y < 3; y += 1)
    for (let x = 0; x < 7; x += 1)
      entities.push({ type: "grass", variant: "ts-10-1", x, y });
  entities.push(
    { type: MapEntityTypeId.MIRROR, x: 1, y: 0, state: { variant: "right-bottom" } },
    { type: MapEntityTypeId.ICE_BLOCK, x: 2, y: 0 },
    { type: MapEntityTypeId.DRAGON, x: 4, y: 0, direction: "left" },
    { type: MapEntityTypeId.BOBBY, x: 6, y: 0, direction: "left" },
  );
  const world = new World(
    { schemaVersion: 1, width: 7, height: 3, entities },
    { motionDurationMs: DEFAULT_FIREBALL_CELL_MS },
  );
  const actor = world.query.entitiesWithFact("player")[0];

  world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction: "left",
        cause: { type: "player-input" },
      },
    ],
  });
  const almostSpawned = update(world, 1, DEFAULT_DRAGON_WINDUP_MS);
  assert.equal(
    almostSpawned.events.some(
      (event) => event.type === "dragon-fireball-spawned",
    ),
    false,
  );
  // Dragon is triggered at the entering motion's midpoint. Only the remainder
  // of that WorldTick belongs to the newly started wind-up Action.
  const spawned = update(world, 2, DEFAULT_FIREBALL_CELL_MS / 2);
  assert.ok(spawned.events.some(
    (event) => event.type === "dragon-fireball-spawned",
  ));
  const fireball = world.query.entitiesMatching({ kind: "type", value: RuntimeEntityTypeId.FIREBALL })[0];
  assert.deepEqual(fireball.anchor, { x: 3, y: 0 });
  assert.equal(world.cameraTarget, fireball.id);

  const melted = update(world, 3, DEFAULT_FIREBALL_CELL_MS);
  assert.deepEqual(world.entity(fireball.id).anchor, { x: 2, y: 0 });
  assert.equal(
    world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.ICE_BLOCK }).length,
    0,
  );
  assert.ok(melted.events.some((event) => event.type === "ice-melted"));

  update(world, 4, DEFAULT_FIREBALL_CELL_MS);
  assert.deepEqual(world.entity(fireball.id).anchor, { x: 1, y: 0 });
  assert.equal(world.entity(fireball.id).direction, "down");

  update(world, 5, DEFAULT_FIREBALL_CELL_MS);
  assert.deepEqual(world.entity(fireball.id).anchor, { x: 1, y: 1 });
});

test("Fireball impact removes the projectile and releases camera focus", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: RuntimeEntityTypeId.FIREBALL, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.CRUMBLY_ROCK, x: 1, y: 0 },
    ],
  });

  update(world, 1, 1);
  const impact = update(world, 2, DEFAULT_FIREBALL_CELL_MS);
  assert.equal(world.query.entitiesMatching({ kind: "type", value: RuntimeEntityTypeId.FIREBALL }).length, 0);
  assert.equal(world.cameraTarget, null);
  assert.ok(impact.events.some((event) => event.type === "fireball-impact"));
});

test("Fireball 只按目标地形传播，Snow 与水上的 Plank 均不能提供许可", () => {
  for (const targetEntities of [
    [
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: MapEntityTypeId.SNOW, x: 1, y: 0 },
    ],
    [
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
    ],
  ]) {
    const world = new World({
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
        ...targetEntities,
        { type: RuntimeEntityTypeId.FIREBALL, x: 0, y: 0, direction: "right" },
      ],
    });
    update(world, 1, 1);
    update(world, 2, DEFAULT_FIREBALL_CELL_MS);
    assert.equal(world.query.entitiesMatching({ kind: "type", value: RuntimeEntityTypeId.FIREBALL }).length, 0);
  }
});

test("Fireball 可以经过 Moon 天空地形和普通对象", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, variant: "large-star", x: 0, y: 0 },
      { type: MapEntityTypeId.MOON, variant: "ts-5-11", x: 1, y: 0 },
      { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
      { type: RuntimeEntityTypeId.FIREBALL, x: 0, y: 0, direction: "right" },
    ],
  });
  const fireball = world.query.entitiesMatching({ kind: "type", value: RuntimeEntityTypeId.FIREBALL })[0];
  update(world, 1, 1);
  update(world, 2, DEFAULT_FIREBALL_CELL_MS);
  assert.deepEqual(world.entity(fireball.id).anchor, { x: 1, y: 0 });
});

test("Fireball 按四种 Mirror 语义 variant 反射，并拒绝其余入射方向", () => {
  const reflections = {
    "right-bottom": { left: "down", up: "right" },
    "left-bottom": { right: "down", up: "left" },
    "right-top": { left: "up", down: "right" },
    "left-top": { right: "up", down: "left" },
  };
  const starts = {
    left: { x: 2, y: 1 },
    right: { x: 0, y: 1 },
    up: { x: 1, y: 2 },
    down: { x: 1, y: 0 },
  };
  for (const [variant, table] of Object.entries(reflections)) {
    for (const [incoming, start] of Object.entries(starts)) {
      const entities = [];
      for (let y = 0; y < 3; y += 1) {
        for (let x = 0; x < 3; x += 1)
          entities.push({ type: "grass", variant: "ts-10-1", x, y });
      }
      entities.push(
        { type: MapEntityTypeId.MIRROR, variant, x: 1, y: 1 },
        { type: RuntimeEntityTypeId.FIREBALL, ...start, direction: incoming },
      );
      const world = new World({ schemaVersion: 1, width: 3, height: 3, entities });
      update(world, 1, 1);
      update(world, 2, DEFAULT_FIREBALL_CELL_MS);
      const fireballs = world.query.entitiesMatching({
        kind: "type",
        value: RuntimeEntityTypeId.FIREBALL,
      });
      assert.equal(fireballs.length, table[incoming] ? 1 : 0, `${variant}/${incoming}`);
      if (fireballs.length === 1) {
        assert.deepEqual(fireballs[0].anchor, { x: 1, y: 1 });
        assert.equal(fireballs[0].direction, table[incoming], `${variant}/${incoming}`);
      }
    }
  }
});
