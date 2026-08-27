import test from "node:test";
import assert from "node:assert/strict";
import * as runtime from "../dist/public.js";
import * as authoring from "../dist/authoring.js";

test("gameplay package surface does not expose Engine implementation internals", () => {
  for (const name of [
    "World",
    "Renderer",
    "Camera",
    "EntityStore",
    "SpatialIndex",
    "EntityRegistry",
    "VisualRegistry",
    "WorldPreview",
    "CommandQueue",
    "BehaviorRegistry",
    "builtinEntityModules",
    "entityRegistry",
    "visualRegistry",
  ]) {
    assert.equal(name in runtime, false, `@bobby/engine must not export ${name}`);
  }

  assert.equal(typeof runtime.Game, "function");
  assert.equal(typeof runtime.createGameplayRuntime, "function");
  assert.equal(typeof runtime.InputController, "function");
});

test("authoring internals are opt-in through the explicit authoring entrypoint", () => {
  assert.equal(typeof authoring.createBuiltinEntityRegistry, "function");
  assert.equal(typeof authoring.EntityRegistry, "function");
  assert.equal(typeof authoring.SpatialIndex, "function");
});
