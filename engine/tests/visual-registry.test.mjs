import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityRegistry,
  EntityStore,
  SpatialIndex,
  SpatialVisualQuery,
  VisualRegistry,
  deterministicVisualVariantIndex,
} from "../dist/index.js";

function definition(type, extra = {}) {
  return {
    type,
    traits: [],
    stackBand: "content",
    presentation: { name: type },
    ...extra,
  };
}

test("Visual resolver 可以只读查询任意 Cell/Presence/Entity", () => {
  const entities = new EntityRegistry();
  const sensor = definition("sensor", {
    presentation: { name: "Sensor", visual: "sensor-visual" },
  });
  const marker = definition("marker");
  entities.registerAll([sensor, marker]);

  const store = new EntityStore([
    { type: "sensor", x: 0, y: 0 },
    { type: "marker", x: 2, y: 0 },
  ]);
  const spatial = new SpatialIndex(store, entities, 3, 1);
  const query = new SpatialVisualQuery(store, spatial);
  const visuals = new VisualRegistry();
  visuals.register({
    id: "sensor-visual",
    resolve(context) {
      const remote = context.query.presencesAt({ x: 2, y: 0 }).at(-1);
      const remoteEntity = remote ? context.query.entity(remote.entityId) : undefined;
      return remoteEntity
        ? { layers: [{ kind: "custom", id: `sees:${remoteEntity.type}` }] }
        : null;
    },
  });

  const runtimeSensor = store.all()[0];
  assert.ok(runtimeSensor);
  const presence = spatial.presencesForEntity(runtimeSensor.id)[0];
  assert.ok(presence);
  assert.deepEqual(
    visuals.resolve(sensor, {
      entity: runtimeSensor,
      presence,
      query,
    }),
    { layers: [{ kind: "custom", id: "sees:marker" }] },
  );
});

test("persisted visual variant 用 type + x + y + placement sequence 稳定选择并写入 properties", () => {
  const entityDefinition = definition("flower", {
    presentation: { name: "Flower", visual: "flower-visual" },
  });
  const visuals = new VisualRegistry();
  visuals.register({
    id: "flower-visual",
    authoring: {
      persistedVariant: {
        property: "visualVariant",
        values: ["white", "yellow", "pink", "red"],
      },
    },
    resolve: () => null,
  });

  const source = { type: "flower", x: 4, y: 5 };
  const first = visuals.initializeAuthoringEntity(source, entityDefinition, 17);
  const again = visuals.initializeAuthoringEntity(source, entityDefinition, 17);
  assert.deepEqual(first, again);
  assert.ok(["white", "yellow", "pink", "red"].includes(first.properties.visualVariant));

  const fixed = visuals.initializeAuthoringEntity(
    { ...source, properties: { visualVariant: "pink" } },
    entityDefinition,
    999,
  );
  assert.equal(fixed.properties.visualVariant, "pink");

  const variants = new Set(
    Array.from({ length: 32 }, (_, sequence) =>
      deterministicVisualVariantIndex("flower", 4, 5, sequence, 4),
    ),
  );
  assert.equal(variants.size, 4);
});
