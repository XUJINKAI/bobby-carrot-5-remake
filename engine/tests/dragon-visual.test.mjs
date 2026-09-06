import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityCatalog,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";

function dragonLayers(direction) {
  const catalog = createBuiltinEntityCatalog();
  const store = new EntityStore([
    { type: EntityTypeId.DRAGON, x: 2, y: 1, direction },
  ]);
  const spatial = new SpatialIndex(store, catalog.entities, 5, 3);
  const query = new SpatialVisualQuery(store, spatial);
  const visuals = createBuiltinVisualRegistry();
  const entity = store.all()[0];
  const definition = catalog.require(EntityTypeId.DRAGON);
  return spatial.presencesForEntity(entity.id).map((presence) => ({
    role: presence.role,
    x: presence.cell.x,
    layer: visuals.resolve(definition, { entity, presence, query }).layers[0],
  }));
}

test("Dragon left/right mirror roles around the same body anchor", () => {
  const left = dragonLayers("left");
  assert.deepEqual(
    left.map((item) => [item.role, item.x, item.layer.flipX ?? false]),
    [
      ["head", 1, false],
      ["body", 2, false],
      ["tail", 3, false],
    ],
  );

  const right = dragonLayers("right");
  assert.deepEqual(
    right.map((item) => [item.role, item.x, item.layer.flipX ?? false]),
    [
      ["head", 3, true],
      ["body", 2, true],
      ["tail", 1, true],
    ],
  );

  assert.deepEqual(
    left.map((item) => item.x).sort(),
    right.map((item) => item.x).sort(),
  );
});
