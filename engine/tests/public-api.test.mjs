import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../dist/public.js";

test("public Engine API exposes gameplay plus generic Entity and Visual structures", () => {
  for (const name of [
    "Game",
    "createGameplayRuntime",
    "AudioRuntime",
    "InputController",
    "EntityStore",
    "SpatialIndex",
    "EntityRegistry",
    "VisualRegistry",
    "EntityCatalog",
    "createBuiltinEntityCatalog",
  ]) {
    assert.equal(typeof engine[name], "function", name);
  }
});

test("public Engine API does not expose Editor authoring operations", () => {
  assert.equal("initializeAuthoringEntity" in engine.VisualRegistry.prototype, false);
  assert.equal("deterministicVisualVariantIndex" in engine, false);
  assert.equal("EditorDocument" in engine, false);
  assert.equal("resolveEditorPalette" in engine, false);
});
