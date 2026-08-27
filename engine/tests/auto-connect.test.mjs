import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDINAL_CONNECTION,
  EntityRegistry,
  EntityStore,
  SpatialIndex,
  SpatialVisualQuery,
  cardinalConnectionMask,
  resolveCardinalTopology,
} from "../dist/index.js";

const N = CARDINAL_CONNECTION.north;
const E = CARDINAL_CONNECTION.east;
const S = CARDINAL_CONNECTION.south;
const W = CARDINAL_CONNECTION.west;

test("16 种 cardinal mask 归一为六类 topology + rotation", () => {
  assert.deepEqual(resolveCardinalTopology(0), { mask: 0, shape: "isolated", rotation: 0 });
  assert.deepEqual(resolveCardinalTopology(E), { mask: E, shape: "end", rotation: 0 });
  assert.deepEqual(resolveCardinalTopology(S), { mask: S, shape: "end", rotation: 1 });
  assert.deepEqual(resolveCardinalTopology(W), { mask: W, shape: "end", rotation: 2 });
  assert.deepEqual(resolveCardinalTopology(N), { mask: N, shape: "end", rotation: 3 });
  assert.deepEqual(resolveCardinalTopology(E | W), {
    mask: E | W,
    shape: "straight",
    rotation: 0,
  });
  assert.deepEqual(resolveCardinalTopology(N | S), {
    mask: N | S,
    shape: "straight",
    rotation: 1,
  });
  assert.deepEqual(resolveCardinalTopology(E | S), {
    mask: E | S,
    shape: "corner",
    rotation: 0,
  });
  assert.deepEqual(resolveCardinalTopology(N | E | S), {
    mask: N | E | S,
    shape: "tee",
    rotation: 0,
  });
  assert.deepEqual(resolveCardinalTopology(N | E | S | W), {
    mask: 15,
    shape: "cross",
    rotation: 0,
  });
});

test("AutoConnect predicate 可以连接不同 Entity type", () => {
  const registry = new EntityRegistry();
  for (const type of ["fence", "gate", "rock"])
    registry.register({
      type,
      traits: [],
      stackBand: "content",
      presentation: { name: type },
    });
  const store = new EntityStore([
    { type: "fence", x: 1, y: 1 },
    { type: "gate", x: 2, y: 1 },
    { type: "rock", x: 1, y: 0 },
  ]);
  const spatial = new SpatialIndex(store, registry, 3, 3);
  const query = new SpatialVisualQuery(store, spatial);
  const fence = store.all().find((entity) => entity.type === "fence");
  assert.ok(fence);
  const presence = spatial.presencesForEntity(fence.id)[0];
  assert.ok(presence);

  const mask = cardinalConnectionMask(
    { entity: fence, presence, query },
    (entity) => entity.type === "fence" || entity.type === "gate",
  );
  assert.equal(mask, E, "Gate 可以被 Fence Visual 当作可连接邻居；Rock 不会连接");
});
