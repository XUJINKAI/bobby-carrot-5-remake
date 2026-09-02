import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  builtinEntityModules,
  createBuiltinBehaviorRegistry,
} from "../dist/entities/registry.js";

function moduleFor(type) {
  const module = builtinEntityModules.find((candidate) => candidate.definition.type === type);
  assert.ok(module, `missing EntityModule for ${type}`);
  return module;
}

function bindingIds(module) {
  return module.behaviorBindings?.map(({ trait, behavior }) => [trait, behavior.id]) ?? [];
}

test("EntityModule colocates definition visual and behavior bindings", () => {
  const carrot = moduleFor(EntityTypeId.CARROT);
  assert.ok(carrot.visual);
  assert.deepEqual(bindingIds(carrot), [["collectible", "collectible"]]);
  assert.ok(carrot.definition.behaviors?.includes("collectible"));

  const water = moduleFor(EntityTypeId.WATER);
  assert.ok(water.visual);
  assert.deepEqual(bindingIds(water), [["water", "water-requires-overlay"]]);
  assert.ok(water.definition.behaviors?.includes("water-requires-overlay"));

  const portal = moduleFor(EntityTypeId.PORTAL);
  assert.ok(portal.visual);
  assert.deepEqual(bindingIds(portal), [["portal", "portal"]]);
  assert.ok(portal.definition.behaviors?.includes("portal"));
});

test("BehaviorRegistry is built from the same builtin EntityModule list", () => {
  const registry = createBuiltinBehaviorRegistry();
  const ids = registry.all().map((behavior) => behavior.id).sort();
  assert.deepEqual(ids, [
    "bonus-key-vendor",
    "collectible",
    "dialog",
    "fill-egg-nest-on-leave",
    "hazard",
    "lock",
    "mowable",
    "pickup",
    "portal",
    "shovelable",
    "stateful-block",
    "water-requires-overlay",
  ]);
  assert.equal(registry.resolve([], ["collectible"])[0]?.id, "collectible");
  assert.equal(
    registry.resolve([], ["water"])[0]?.id,
    "water-requires-overlay",
  );
});
