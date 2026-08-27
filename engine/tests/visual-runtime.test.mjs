import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  builtinEntityModules,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
  resolveEntityVisualPreview,
  WorldPreview,
  SpatialVisualQuery,
} from "../dist/index.js";

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
  const level = {
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  };
  const preview = new WorldPreview(level, entities);
  const bobby = preview.entities.all().find((entity) => entity.type === EntityTypeId.BOBBY);
  assert.ok(bobby);
  const presence = preview.spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  const query = new SpatialVisualQuery(preview.entities, preview.spatial);
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

test("builtin Entity modules own their visual definitions beside gameplay definitions", () => {
  assert.ok(builtinEntityModules.length > 0);
  for (const module of builtinEntityModules) {
    assert.equal(module.visual?.id, module.definition.presentation.visual ?? module.definition.type);
  }
});
