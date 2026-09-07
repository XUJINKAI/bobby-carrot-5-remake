import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  MapEntityTypeId,
  entityMapDefinition,
} from "@bobby/model";
import {
  builtinEntityDefinitions,
  createBuiltinEntityCatalog,
  createBuiltinEntityRegistry,
} from "../dist/entities/registry.js";

test("所有 canonical EntityTypeId 恰好注册一次", () => {
  const definitions = builtinEntityDefinitions.map((item) => item.type);
  for (const type of new Set(Object.values(EntityTypeId))) {
    assert.equal(
      definitions.filter((candidate) => candidate === type).length,
      1,
      type,
    );
  }
  assert.equal(createBuiltinEntityRegistry().all().length, definitions.length);
});

test("Registry 不包含 original/custom identity 前缀", () => {
  for (const definition of createBuiltinEntityRegistry().all()) {
    assert.equal(definition.type.includes(":"), false, definition.type);
  }
});

test("未命名原版 DAT 语义仍是普通 canonical Entity Definition", () => {
  const registry = createBuiltinEntityRegistry();
  const catalog = createBuiltinEntityCatalog();
  assert.deepEqual(
    registry.require("background-variant-001").traits,
    ["bean-growth-space"],
  );
  assert.equal(registry.require("background-variant-001").stackOrder, 0);
  assert.equal(
    catalog.require("background-variant-001").presentation.name,
    "Background Variant 1",
  );
  assert.deepEqual(registry.require("walkable-variant-01").traits, ["walkable"]);
  assert.equal(registry.require("object-variant-001").stackOrder, 100);
  assert.equal(
    catalog.require("object-variant-001").presentation.name,
    "Object Variant 1",
  );
});

test("稳定 Surface ABI 由 Engine 直接注册通行语义", () => {
  const registry = createBuiltinEntityRegistry();
  assert.deepEqual(registry.require(MapEntityTypeId.GRASS).traits, ["walkable"]);
  assert.deepEqual(registry.require(MapEntityTypeId.TREE).traits, [
    "bean-growth-space",
  ]);
  assert.deepEqual(registry.require(MapEntityTypeId.WATERFALL).traits, [
    "bean-growth-space",
    "water",
    "waterfall",
  ]);
  assert.deepEqual(registry.require("surface-7-1").traits, ["walkable"]);
  assert.deepEqual(registry.require("surface-1-1").traits, [
    "bean-growth-space",
  ]);
});

test("Start 是普通可步行 Entity，不携带出生语义", () => {
  const start = createBuiltinEntityRegistry().require("start");
  assert.equal(start.stackOrder, 0);
  assert.deepEqual(start.traits, ["walkable"]);
  assert.equal(start.traits.includes("start"), false);
});

test("合并类型的稳定 Map 字段由 Model contract 声明", () => {
  const fieldKeys = (type) =>
    entityMapDefinition(type)?.fields.map((field) => field.key) ?? [];
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

test("Sandman / Dream Machine / Beaver 使用固定 footprint", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of ["sandman", "dream-machine", "beaver"]) {
    const footprint = registry.require(type).footprint;
    assert.equal("parts" in footprint, true, type);
    assert.deepEqual(
      footprint.parts.map((part) => [part.dx, part.dy, part.role]),
      [
        [0, 0, "head"],
        [0, 1, "body"],
      ],
      type,
    );
  }
});

test("Fence 只有一个 canonical EntityType，视觉拓扑不再编码进 type", () => {
  const registry = createBuiltinEntityRegistry();
  const fence = registry.require(EntityTypeId.FENCE);
  assert.deepEqual(fence.traits, ["blocking", "fence"]);
  assert.equal(
    Object.values(EntityTypeId).some((type) => /^fence-\d$/.test(type)),
    false,
  );
});
