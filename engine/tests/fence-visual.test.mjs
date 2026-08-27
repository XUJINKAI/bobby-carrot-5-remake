import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityStore,
  EntityTypeId,
  SpatialIndex,
  SpatialVisualQuery,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/index.js";

const EXPECTED = new Map([
  [48, { column: 9, row: 15 }],
  [49, { column: 10, row: 15 }],
  [50, { column: 11, row: 15 }],
  [51, { column: 12, row: 15 }],
  [52, { column: 13, row: 15 }],
  [53, { column: 14, row: 15 }],
]);

function fenceArt(neighbors) {
  const registry = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const source = [{ type: EntityTypeId.FENCE, x: 1, y: 1 }];
  for (const [dx, dy] of neighbors)
    source.push({ type: EntityTypeId.FENCE, x: 1 + dx, y: 1 + dy });

  const store = new EntityStore(source);
  const spatial = new SpatialIndex(store, registry, 3, 3);
  const query = new SpatialVisualQuery(store, spatial);
  const entity = store.all()[0];
  const presence = spatial.presencesForEntity(entity.id)[0];
  const composition = visuals.resolve(registry.require(EntityTypeId.FENCE), {
    entity,
    presence,
    query,
  });
  const layer = composition.layers[0];
  assert.equal(layer.kind, "atlas");
  return { column: layer.column, row: layer.row };
}

for (const [name, neighbors, art] of [
  ["left+right", [[-1, 0], [1, 0]], 48],
  ["down", [[0, 1]], 49],
  ["left", [[-1, 0]], 50],
  ["down+right", [[0, 1], [1, 0]], 51],
  ["down+left", [[0, 1], [-1, 0]], 52],
  ["right", [[1, 0]], 53],
]) {
  test(`Fence ${name} uses art ${art}`, () => {
    assert.deepEqual(fenceArt(neighbors), EXPECTED.get(art));
  });
}

test("Fence ignores the upper neighbor", () => {
  assert.deepEqual(fenceArt([[0, -1]]), EXPECTED.get(48));
});

test("Fence falls back to art 48 for isolated and all-three cases", () => {
  assert.deepEqual(fenceArt([]), EXPECTED.get(48));
  assert.deepEqual(
    fenceArt([[-1, 0], [0, 1], [1, 0]]),
    EXPECTED.get(48),
  );
});
