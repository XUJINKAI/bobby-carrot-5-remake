import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  builtinEntityModules,
  createBuiltinBehaviorRegistry,
  createBuiltinRuntimeActionRegistry,
} from "../../../engine/dist/entities/registry.js";
import { createBuiltinMechanismRegistry } from "../../../engine/dist/mechanism/builtinEntityMechanisms.js";
import { resolveEffectiveBehaviors } from "../../../engine/dist/world/behavior/EffectiveBehavior.js";

function moduleFor(type) {
  const module = builtinEntityModules.find((candidate) => candidate.definition.type === type);
  assert.ok(module, `missing EntityModule for ${type}`);
  return module;
}

function bindingIds(module) {
  return module.behaviorBindings?.map(({ behavior }) => behavior.id) ?? [];
}

test("EntityModule 显式组合通用 Mechanism 与对象 Behavior", () => {
  const carrot = moduleFor(MapEntityTypeId.CARROT);
  assert.ok(carrot.visual);
  assert.deepEqual(bindingIds(carrot), ["collect-carrot"]);
  assert.ok(carrot.definition.behaviors?.includes("collect-carrot"));

  const water = moduleFor(MapEntityTypeId.WATER);
  assert.ok(water.visual);
  assert.deepEqual(bindingIds(water), ["water-passage"]);
  assert.deepEqual(water.definition.mechanisms, []);

  const portal = moduleFor(MapEntityTypeId.PORTAL);
  assert.ok(portal.visual);
  assert.deepEqual(bindingIds(portal), ["portal"]);
  assert.ok(portal.definition.behaviors?.includes("portal"));

  const ice = moduleFor(MapEntityTypeId.ICE);
  assert.deepEqual(bindingIds(ice), ["ice-slide"]);

  const speed = moduleFor(MapEntityTypeId.SPEED);
  assert.deepEqual(bindingIds(speed), ["speed-boost"]);
  assert.deepEqual(speed.runtimeActions?.map((action) => action.kind), ["speed-run"]);

  const cloud = moduleFor(MapEntityTypeId.CLOUD);
  const leaf = moduleFor(MapEntityTypeId.LEAF);
  assert.deepEqual(cloud.runtimeActions?.map((action) => action.kind), ["moving-entity"]);
  assert.equal(cloud.runtimeActions?.[0], leaf.runtimeActions?.[0]);
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
  assert.equal(registry.resolve(["collectible"])[0]?.id, "collectible");
  assert.deepEqual(registry.resolve([]), []);
  const mechanisms = createBuiltinMechanismRegistry();
  assert.deepEqual(
    resolveEffectiveBehaviors(
      moduleFor(MapEntityTypeId.WATER).definition,
      registry,
      mechanisms,
    ).map((behavior) => behavior.id),
    ["water-passage"],
  );
});

test("RuntimeActionRegistry composes core actions with Entity-owned actions", () => {
  const registry = createBuiltinRuntimeActionRegistry();
  assert.equal(registry.require("delay").kind, "delay");
  assert.equal(registry.require("delayed-move").kind, "delayed-move");
  assert.equal(registry.require("speed-run").kind, "speed-run");
});
