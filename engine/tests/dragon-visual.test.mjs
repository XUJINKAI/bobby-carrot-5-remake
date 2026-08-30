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

test("Dragon left uses source art and right mirrors every footprint tile", () => {
  const left = dragonLayers("left");
  assert.deepEqual(
    left.map((item) => [item.role, item.x, item.layer.flipX ?? false]),
    [
      ["head", 2, false],
      ["body", 3, false],
      ["tail", 4, false],
    ],
  );

  const right = dragonLayers("right");
  assert.deepEqual(
    right.map((item) => [item.role, item.x, item.layer.flipX ?? false]),
    [
      ["head", 2, true],
      ["body", 1, true],
      ["tail", 0, true],
    ],
  );
});
