import test from "node:test";
import assert from "node:assert/strict";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";

function registry() {
  const registry = new EntityRegistry();
  registry.registerAll([
    {
      type: "water",
      traits: ["water"],
      stackOrder: 0,
      presentation: { name: "Water" },
    },
    {
      type: "coin",
      traits: ["collectible"],
      stackOrder: 100,
      presentation: { name: "Coin" },
    },
    {
      type: "grass",
      traits: ["mowable"],
      stackOrder: 200,
      presentation: { name: "Grass" },
    },
    {
      type: "dragon",
      traits: ["dragon"],
      stackOrder: 100,
      footprint: {
        parts: [
          { dx: 0, dy: 0, role: "head", traits: ["blocking"] },
          { dx: 1, dy: 0, role: "body", traits: ["blocking"] },
          { dx: 2, dy: 0, role: "tail", traits: ["dragon-trigger"] },
        ],
      },
      presentation: { name: "Dragon" },
    },
    {
      type: "ice",
      traits: ["meltable"],
      stackOrder: 200,
      presentation: { name: "Ice" },
    },
  ]);
  return registry;
}

function createSpatialPreview(level, entityRegistry = registry()) {
  const entities = new EntityStore(level.entities);
  const spatial = new SpatialIndex(
    entities,
    entityRegistry,
    level.width,
    level.height,
  );
  return {
    entities,
    spatial,
    inspectCell(x, y) {
      const presences = spatial.presencesAt({ x, y }).map((presence) => ({
        presence,
        entity: entities.require(presence.entityId),
      }));
      return {
        presences,
        top: presences.at(-1) ?? null,
      };
    },
  };
}

test("同格 Entity 只按 stackOrder 形成稳定 Cell Stack", () => {
  const preview = createSpatialPreview({
    schemaVersion: 1,
    width: 3,
    height: 3,
    entities: [
      { type: "grass", x: 1, y: 1 },
      { type: "coin", x: 1, y: 1 },
      { type: "water", x: 1, y: 1 },
    ],
  });
  const cell = preview.inspectCell(1, 1);
  assert.deepEqual(
    cell.presences.map(({ entity }) => entity.type),
    ["water", "coin", "grass"],
  );
  assert.deepEqual(
    cell.presences.map(({ presence }) => presence.stackOrder),
    [0, 100, 200],
  );
  assert.equal(cell.top?.entity.type, "grass");
});

test("definition stackOrder 为 footprint 提供基准并保留 part 顺序", () => {
  const preview = createSpatialPreview({
    schemaVersion: 1,
    width: 6,
    height: 3,
    entities: [{ type: "dragon", x: 1, y: 1 }],
  });
  const presences = preview.spatial.presencesForEntity(1);
  assert.deepEqual(
    presences.map((presence) => presence.stackOrder),
    [100, 101, 102],
  );
});

test("Dragon 保持一个 Entity，footprint 生成 head/body/tail Presence", () => {
  const preview = createSpatialPreview({
    schemaVersion: 1,
    width: 6,
    height: 3,
    entities: [
      { type: "water", x: 3, y: 1 },
      { type: "dragon", x: 1, y: 1 },
      { type: "ice", x: 3, y: 1 },
    ],
  });
  const tail = preview.inspectCell(3, 1);
  assert.deepEqual(
    tail.presences.map(({ entity, presence }) => [entity.type, presence.role]),
    [
      ["water", undefined],
      ["dragon", "tail"],
      ["ice", undefined],
    ],
  );
  assert.equal(
    new Set(tail.presences.map(({ presence }) => presence.entityId)).size,
    3,
  );
  assert.equal(
    preview.entities.all().filter((entity) => entity.type === "dragon").length,
    1,
  );
});

test("销毁高 stackOrder Entity 后 Dragon tail Presence 自动重新暴露", () => {
  const store = new EntityStore([
    { type: "water", x: 3, y: 1 },
    { type: "dragon", x: 1, y: 1 },
    { type: "ice", x: 3, y: 1 },
  ]);
  const spatial = new SpatialIndex(store, registry(), 6, 3);
  const ice = store.all().find((entity) => entity.type === "ice");
  assert.ok(ice);
  spatial.removeEntity(ice.id);
  store.destroy(ice.id);
  assert.equal(spatial.topPresenceAt({ x: 3, y: 1 })?.role, "tail");
});

test("EntityStore snapshot 同时保存 nextEntityId", () => {
  const store = new EntityStore([{ type: "coin", x: 0, y: 0 }]);
  const snapshot = store.snapshot();
  const spawned = store.spawn({ type: "coin", x: 1, y: 0 });
  assert.equal(spawned.id, 2);
  store.restore(snapshot);
  assert.equal(store.spawn({ type: "coin", x: 2, y: 0 }).id, 2);
});
