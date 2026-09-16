import test from "node:test";
import assert from "node:assert/strict";
import {
  MapEntityTypeId,
  entityMapDefinition,
  ENTITY_MAP_DEFINITIONS,
} from "@bobby/model";
import {
  builtinEntityDefinitions,
  createBuiltinEntityCatalog,
  createBuiltinEntityRegistry,
} from "../dist/entities/registry.js";
import { builtinEngineEnvironment } from "../dist/public.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";

const factRegistry = builtinEngineEnvironment.facts;

test("所有 Map Entity 合同都对应可加载的 Runtime Definition", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of Object.keys(ENTITY_MAP_DEFINITIONS)) {
    assert.doesNotThrow(
      () => registry.require(type),
      type,
    );
  }
});

test("所有 canonical MapEntityTypeId 恰好注册一次", () => {
  const definitions = builtinEntityDefinitions.map((item) => item.type);
  for (const type of new Set(Object.values(MapEntityTypeId))) {
    assert.equal(
      definitions.filter((candidate) => candidate === type).length,
      1,
      type,
    );
  }
  assert.equal(createBuiltinEntityRegistry().all().length, definitions.length);
});

test("未知 Entity 使用不进入正式 Catalog 的惰性占位定义", () => {
  const registry = createBuiltinEntityRegistry();
  const unknown = registry.require("future-mechanic");

  assert.equal(registry.has("future-mechanic"), false);
  assert.equal(unknown.placeholder, "unknown");
  assert.deepEqual(unknown.presenceFacts, []);
  assert.equal(
    registry.all().some((definition) => definition.type === "future-mechanic"),
    false,
  );
});

test("Registry 不包含 original/custom identity 前缀", () => {
  for (const definition of createBuiltinEntityRegistry().all()) {
    assert.equal(definition.type.includes(":"), false, definition.type);
  }
});

test("Surface 与 Object 都只注册稳定语义 Entity Definition", () => {
  const registry = createBuiltinEntityRegistry();
  assert.deepEqual(registry.require(MapEntityTypeId.WATER).presenceFacts, []);
  assert.deepEqual(registry.require(MapEntityTypeId.GRASS).presenceFacts, []);
  assert.deepEqual(registry.require(MapEntityTypeId.STUMP).presenceFacts, []);
});

test("稳定 Surface ABI 由各 Definition 的 Presence Fact resolver 投影", () => {
  assert.deepEqual(projectedFacts(MapEntityTypeId.GRASS), ["walkable"]);
  assert.deepEqual(projectedFacts(MapEntityTypeId.TREE), [
    "growth-substrate",
  ]);
  assert.deepEqual(projectedFacts(MapEntityTypeId.WATERFALL), [
    "water",
    "growth-substrate",
  ]);
  assert.deepEqual(projectedFacts(MapEntityTypeId.STARFIELD), [
    "sky",
    "growth-substrate",
  ]);
  assert.deepEqual(projectedFacts(MapEntityTypeId.MOON), [
    "sky",
    "growth-substrate",
  ]);
});

test("Start 是普通可步行 Entity，不携带出生语义", () => {
  const start = createBuiltinEntityRegistry().require("start");
  assert.equal(start.stackOrder, undefined);
  assert.deepEqual(start.presenceFacts, ["walkable"]);
  assert.equal(start.presenceFacts.includes("start"), false);
});

test("合并类型的稳定 Map 字段由 Model contract 声明", () => {
  const fieldKeys = (type) =>
    entityMapDefinition(type)?.fields.map((field) => field.key) ?? [];
  assert.deepEqual(fieldKeys("bobby"), ["controller", "mirrorX", "mirrorY"]);
  assert.deepEqual(fieldKeys("speed-switch"), ["pressed"]);
  assert.deepEqual(fieldKeys("tide-switch"), ["pressed"]);
  assert.deepEqual(fieldKeys("carousel-switch"), ["pressed"]);
  assert.deepEqual(fieldKeys("wind-switch"), ["direction", "active"]);
  assert.deepEqual(fieldKeys("trap"), ["active"]);
  assert.deepEqual(fieldKeys("mirror"), ["variant"]);
  assert.deepEqual(fieldKeys("carousel"), ["variant"]);
  assert.deepEqual(fieldKeys("color-block"), ["color", "raised"]);
});

test("Dragon 只显式声明 left/right body-centered footprint", () => {
  const dragon = createBuiltinEntityRegistry().require("dragon");
  assert.deepEqual(Object.keys(dragon.footprint.byDirection).sort(), [
    "left",
    "right",
  ]);
  assert.deepEqual(
    dragon.footprint.byDirection.left.map((part) => [
      part.dx,
      part.dy,
      part.role,
    ]),
    [
      [-1, 0, "head"],
      [0, 0, "body"],
      [1, 0, "tail"],
    ],
  );
  assert.deepEqual(
    dragon.footprint.byDirection.right.map((part) => [
      part.dx,
      part.dy,
      part.role,
    ]),
    [
      [1, 0, "head"],
      [0, 0, "body"],
      [-1, 0, "tail"],
    ],
  );
});

test("Sandman / Dream Machine / Beaver 只使用 body anchor Presence", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of ["sandman", "dream-machine", "beaver"]) {
    const definition = registry.require(type);
    assert.equal(definition.footprint, undefined, type);
    assert.deepEqual(
      definition.presenceFacts,
      ["blocking", "vertical-occupant"],
      type,
    );
  }
});

test("Fence 只有一个 canonical EntityType，视觉拓扑不再编码进 type", () => {
  const registry = createBuiltinEntityRegistry();
  const fence = registry.require(MapEntityTypeId.FENCE);
  assert.deepEqual(fence.presenceFacts, ["blocking", "vertical-occupant"]);
  assert.equal(
    Object.values(MapEntityTypeId).some((type) => /^fence-\d$/.test(type)),
    false,
  );
});

function projectedFacts(type) {
  const registry = createBuiltinEntityRegistry();
  const store = new EntityStore([{ type, x: 0, y: 0 }]);
  const spatial = new SpatialIndex(store, registry, 1, 1, factRegistry);
  return spatial.presencesAt({ x: 0, y: 0 })[0]?.facts ?? [];
}
