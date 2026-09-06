import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { DEFAULT_DRAGON_WINDUP_MS } from "../dist/entities/original/dragon.js";
import { DEFAULT_FIREBALL_CELL_MS } from "../dist/entities/original/fireball.js";
import { World } from "../dist/world/World.js";

function update(world, tick, stepMs) {
  return world.update({ tick, stepMs });
}

test("Dragon Fireball moves through World cells, melts Ice, and reflects", () => {
  const entities = [];
  for (let y = 0; y < 3; y += 1)
    for (let x = 0; x < 7; x += 1)
      entities.push({ type: EntityTypeId.GROUND_C, x, y });
  entities.push(
    { type: EntityTypeId.MIRROR, x: 1, y: 0, state: { variant: 1 } },
    { type: EntityTypeId.ICE_BLOCK, x: 2, y: 0 },
    { type: EntityTypeId.DRAGON, x: 3, y: 0, direction: "left" },
    { type: EntityTypeId.BOBBY, x: 6, y: 0, direction: "left" },
  );
  const world = new World(
    { schemaVersion: 1, width: 7, height: 3, entities },
    { motionDurationMs: DEFAULT_FIREBALL_CELL_MS },
  );
  const actor = world.query.entitiesWithTrait("player")[0];

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
  const fireball = world.query.entitiesWithTrait("projectile")[0];
  assert.deepEqual(fireball.anchor, { x: 3, y: 0 });
  assert.equal(world.cameraTarget, fireball.id);

  const melted = update(world, 3, DEFAULT_FIREBALL_CELL_MS);
  assert.deepEqual(world.entity(fireball.id).anchor, { x: 2, y: 0 });
  assert.equal(
    world.query.entitiesWithTrait("meltable").length,
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
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      { type: EntityTypeId.FIREBALL, x: 0, y: 0, direction: "right" },
      { type: EntityTypeId.CRUMBLY_ROCK, x: 1, y: 0 },
    ],
  });

  update(world, 1, 1);
  const impact = update(world, 2, DEFAULT_FIREBALL_CELL_MS);
  assert.equal(world.query.entitiesWithTrait("projectile").length, 0);
  assert.equal(world.cameraTarget, null);
  assert.ok(impact.events.some((event) => event.type === "fireball-impact"));
});
