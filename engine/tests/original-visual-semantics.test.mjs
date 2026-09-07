import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { LEAF_SUPPORT_HEIGHT_PX } from "../dist/entities/original/moving-entities.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";

function resolveCarouselSwitch(pressed) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    {
      type: EntityTypeId.CAROUSEL_SWITCH,
      x: 0,
      y: 0,
      pressed,
    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const entity = store.require(1);
  const presence = spatial.presencesForEntity(entity.id)[0];
  assert.ok(presence);
  return visuals.resolve(entities.require(EntityTypeId.CAROUSEL_SWITCH), {
    entity,
    presence,
    query: new SpatialVisualQuery(store, spatial),
  });
}

test("Carousel Switch pressed and raised visuals match original DAT states", () => {
  assert.deepEqual(resolveCarouselSwitch(true).layers[0], {
    kind: "atlas",
    column: 3,
    row: 10,
  });
  assert.deepEqual(resolveCarouselSwitch(false).layers[0], {
    kind: "atlas",
    column: 4,
    row: 10,
  });
});

test("Leaf support raises Bobby by twelve pixels", () => {
  assert.equal(LEAF_SUPPORT_HEIGHT_PX, 12);
});
