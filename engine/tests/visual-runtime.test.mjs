import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import {
  builtinEntityModules,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { resolveEntityVisualPreview } from "../dist/visual/preview.js";

test("Bobby authoring preview resolves to the same image visual instead of a custom B fallback", () => {
  const composition = resolveEntityVisualPreview({
    type: EntityTypeId.BOBBY,
    direction: "left",
  });
  assert.deepEqual(composition, {
    layers: [
      {
        kind: "image",
        asset: "bobby-left",
        frameWidth: 48,
        frameProgress: 0,
        anchor: "bottom",
      },
    ],
  });
});

test("Bobby walking progress is visual runtime state and does not mutate World", () => {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
    { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
  ]);
  const spatial = new SpatialIndex(store, entities, 2, 1);
  const bobby = store.all().find((entity) => entity.type === EntityTypeId.BOBBY);
  assert.ok(bobby);
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  const query = new SpatialVisualQuery(store, spatial);
  const definition = entities.require(EntityTypeId.BOBBY);
  const composition = visuals.resolve(definition, {
    entity: bobby,
    presence,
    query,
    runtime: { offsetX: -0.5, moving: true, progress: 0.5 },
  });
  assert.equal(composition.layers[0].kind, "image");
  assert.equal(composition.layers[0].frameProgress, 0.5);
  assert.deepEqual(bobby.anchor, { x: 0, y: 0 });
});

test("VisualRuntime owns motion interpolation lifecycle", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.beginMove(7, { x: 1, y: 2 }, { x: 2, y: 2 }, 100, 1000);
  assert.equal(runtime.isAnimating, true);
  assert.equal(runtime.advanceMotion(1050, "linear"), false);
  assert.equal(runtime.isAnimating, true);
  assert.equal(runtime.advanceMotion(1100, "linear"), true);
  assert.equal(runtime.isAnimating, false);
});

test("builtin Entity modules own their visual definitions beside gameplay definitions", () => {
  assert.ok(builtinEntityModules.length > 0);
  for (const module of builtinEntityModules) {
    assert.equal(
      module.visual?.id,
      module.presentation.visual ?? module.definition.type,
    );
  }
});
