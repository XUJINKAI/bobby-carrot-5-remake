import test from "node:test";
import assert from "node:assert/strict";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { VisualRegistry } from "../dist/visual/VisualRegistry.js";
import { prepareRuntimeLevel } from "../dist/public.js";

function definition(type, extra = {}) {
  return {
    type,
    traits: [],
    ...extra,
  };
}

test("Visual resolver 可以只读查询任意 Cell/Presence/Entity", () => {
  const entities = new EntityRegistry();
  const sensor = definition("sensor");
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
      const remoteEntity = remote
        ? context.query.entity(remote.entityId)
        : undefined;
      return remoteEntity
        ? { layers: [{ kind: "image", asset: `sees:${remoteEntity.type}` }] }
        : null;
    },
  });
  visuals.bindEntityVisual("sensor", "sensor-visual");

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
    { layers: [{ kind: "image", asset: "sees:marker" }] },
  );
});

test("VisualRegistry only registers and resolves presentation definitions", () => {
  const visuals = new VisualRegistry();
  visuals.register({ id: "plain", resolve: () => null });
  assert.equal(visuals.require("plain").id, "plain");
  assert.equal("initializeAuthoringEntity" in visuals, false);
});

test("未知 Entity 解析为无素材依赖的 X 占位视觉", () => {
  const entities = new EntityRegistry();
  const unknown = entities.require("future-mechanic");
  const store = new EntityStore([
    { type: "future-mechanic", x: 0, y: 0 },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const query = new SpatialVisualQuery(store, spatial);
  const entity = store.all()[0];
  const presence = spatial.presencesAt({ x: 0, y: 0 })[0];
  assert.ok(entity);
  assert.ok(presence);

  const composition = new VisualRegistry().resolve(unknown, {
    entity,
    presence,
    query,
  });
  assert.equal(composition?.layers[0]?.kind, "canvas");
});

test("字段无效的已知 Entity 也使用 X 占位视觉", () => {
  const entities = new EntityRegistry();
  const level = prepareRuntimeLevel({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [{ type: "grass", x: 0, y: 0, variant: "future" }],
  });
  const store = new EntityStore(level.entities);
  const entity = store.all()[0];
  assert.ok(entity);
  assert.equal(entity.type, "invalid:grass");

  const definition = entities.require(entity.type);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const query = new SpatialVisualQuery(store, spatial);
  const presence = spatial.presencesAt({ x: 0, y: 0 })[0];
  assert.ok(presence);
  assert.equal(
    new VisualRegistry().resolve(definition, { entity, presence, query })
      ?.layers[0]?.kind,
    "canvas",
  );
});
