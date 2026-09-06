import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  builtinEntityModules,
  createBuiltinBehaviorRegistry,
  createBuiltinRuntimeActionRegistry,
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

  const ice = moduleFor(EntityTypeId.ICE);
  assert.deepEqual(bindingIds(ice), [[undefined, "ice-slide"]]);

  const speed = moduleFor(EntityTypeId.SPEED);
  assert.deepEqual(bindingIds(speed), [[undefined, "speed-boost"]]);
  assert.deepEqual(speed.runtimeActions?.map((action) => action.kind), ["speed-run"]);
});

test("BehaviorRegistry is built from the same builtin EntityModule list", () => {
  const registry = createBuiltinBehaviorRegistry();
  const ids = registry.all().map((behavior) => behavior.id).sort();
  const moduleBehaviorIds = [
    ...new Set(
      builtinEntityModules.flatMap((module) =>
        (module.behaviorBindings ?? []).map(({ behavior }) => behavior.id),
      ),
    ),
  ].sort();
  assert.deepEqual(ids, moduleBehaviorIds);
  assert.equal(registry.resolve([], ["collectible"])[0]?.id, "collectible");
  assert.equal(
    registry.resolve([], ["water"])[0]?.id,
    "water-requires-overlay",
  );
});

test("RuntimeActionRegistry composes core actions with Entity-owned actions", () => {
  const registry = createBuiltinRuntimeActionRegistry();
  assert.equal(registry.require("delay").kind, "delay");
  assert.equal(registry.require("delayed-move").kind, "delayed-move");
  assert.equal(registry.require("speed-run").kind, "speed-run");
});
