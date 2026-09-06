import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { createBuiltinEntityRegistry } from "../dist/entities/registry.js";
import { DEFAULT_FIREBALL_CELL_MS } from "../dist/entities/original/fireball.js";
import { World } from "../dist/world/World.js";
import { resolveFootprintCells } from "../dist/world/spatial/Footprint.js";

test("Fireball owns its obstacle policy instead of target-side projectile traits", () => {
  const registry = createBuiltinEntityRegistry();
  const dragon = registry.require(EntityTypeId.DRAGON);
  const rock = registry.require(EntityTypeId.CRUMBLY_ROCK);

  assert.equal(rock.traits.includes("dragon-fire-blocking"), false);
  for (const direction of ["left", "right"]) {
    assert.equal(
      resolveFootprintCells(
        { anchor: { x: 2, y: 0 }, direction },
        dragon.footprint,
      ).some((part) => part.traits?.includes("dragon-fire-blocking")),
      false,
    );
  }
});

test("Fireball stops when the target terrain is outside its propagation domain", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.SNOW, x: 1, y: 0 },
      { type: EntityTypeId.FIREBALL, x: 0, y: 0, direction: "right" },
    ],
  });

  world.update({ tick: 1, stepMs: 1 });
  const result = world.update({ tick: 2, stepMs: DEFAULT_FIREBALL_CELL_MS });

  assert.equal(world.query.entitiesWithTrait("projectile").length, 0);
  assert.ok(result.events.some((event) => event.type === "fireball-impact"));
});

test("Fireball still impacts Crumbly Rock without a blocker trait", () => {
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

  world.update({ tick: 1, stepMs: 1 });
  const result = world.update({ tick: 2, stepMs: DEFAULT_FIREBALL_CELL_MS });

  assert.equal(world.query.entitiesWithTrait("projectile").length, 0);
  assert.ok(result.events.some((event) => event.type === "fireball-impact"));
});
