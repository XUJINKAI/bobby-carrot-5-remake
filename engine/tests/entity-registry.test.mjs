import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  builtinEntityDefinitions,
  createBuiltinEntityRegistry,
} from "../dist/entities/registry.js";

test("所有 canonical EntityTypeId 恰好注册一次", () => {
  const expected = [...new Set(Object.values(EntityTypeId))].sort();
  const actual = builtinEntityDefinitions.map((item) => item.type).sort();
  assert.deepEqual(actual, expected);
  assert.equal(createBuiltinEntityRegistry().all().length, expected.length);
});

test("Registry 不包含 original/custom identity 前缀", () => {
  for (const definition of createBuiltinEntityRegistry().all()) {
    assert.equal(definition.type.includes(":"), false, definition.type);
  }
});

test("Start 是普通可步行 surface，不携带出生语义", () => {
  const start = createBuiltinEntityRegistry().require("start");
  assert.equal(start.stackBand, "surface");
  assert.deepEqual(start.traits, ["walkable"]);
  assert.equal(start.traits.includes("start"), false);
});

test("首轮合并类型使用 state/direction/property 而不是拆分 type", () => {
  const registry = createBuiltinEntityRegistry();
  assert.ok(registry.require("tide").authoring.defaultDirection);
  assert.equal(registry.require("speed-switch").state[0].key, "pressed");
  assert.equal(registry.require("tide-switch").state[0].key, "pressed");
  assert.equal(registry.require("carousel-switch").state[0].key, "pressed");
  assert.deepEqual(
    registry.require("wind-switch").properties.map((field) => field.key),
    ["channel"],
  );
  assert.deepEqual(
    registry.require("wind-switch").state.map((field) => field.key),
    ["active"],
  );
  assert.equal(registry.require("trap").state[0].key, "active");
  assert.equal(registry.require("mirror").state[0].key, "variant");
  assert.ok(registry.require("speed").authoring.defaultDirection);
  assert.equal(registry.require("carousel").state[0].key, "variant");
  assert.equal(registry.require("color-yellow-block").state[0].key, "raised");
  assert.equal(registry.require("color-pink-block").state[0].key, "raised");
});

test("Dragon 是一个 EntityDefinition 并通过 footprint 表达三格", () => {
  const dragon = createBuiltinEntityRegistry().require("dragon");
  assert.deepEqual(
    dragon.footprint.parts.map((part) => [part.dx, part.dy, part.role]),
    [
      [0, 0, "head"],
      [1, 0, "body"],
      [2, 0, "tail"],
    ],
  );
  assert.deepEqual(dragon.authoring.cursor, { dx: 1, dy: 0 });
});
