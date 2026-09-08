import assert from "node:assert/strict";
import test from "node:test";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import { World } from "../../engine/dist/world/World.js";
import {
  createBlankLevel,
  paletteItems,
  parseEditorLevel,
  placeEntity,
  resolvePlacement,
  serializeEditorLevel,
  toLevelMap,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

test("每个可见 Palette 条目都可放置、保存并加载为 World", () => {
  for (const preset of paletteItems(catalog)) {
    const level = createBlankLevel();
    const cell = { x: 5, y: 5 };
    assert.equal(resolvePlacement(level, catalog, preset, cell).valid, true, preset.type);
    const placed = placeEntity(catalog, preset, cell).apply(level);
    const restored = parseEditorLevel(serializeEditorLevel(placed));
    assert.doesNotThrow(() => new World(toLevelMap(restored)), preset.type);
  }
});

test("三色云朵停靠格放置后保留底层地形与持久化颜色", () => {
  for (const color of ["red", "purple", "green"]) {
    const level = createBlankLevel();
    const cell = { x: 5, y: 5 };
    const ground = level.entities.find((entity) => entity.x === 5 && entity.y === 5);
    const placed = placeEntity(catalog, {
      type: "cloud-parking",
      fields: { color },
    }, cell).apply(level);
    const restored = parseEditorLevel(serializeEditorLevel(placed));
    assert.deepEqual(
      restored.entities.filter((entity) => entity.x === 5 && entity.y === 5),
      [ground, { type: "cloud-parking", ...cell, color }],
    );
  }
});

test("草下胡萝卜与 egg 组合可以往返保存", () => {
  for (const type of ["carrot", "egg"]) {
    let level = createBlankLevel();
    for (const entityType of [type, "high-grass"])
      level = placeEntity(catalog, entityType, { x: 5, y: 5 }).apply(level);
    const restored = parseEditorLevel(serializeEditorLevel(level));
    assert.deepEqual(
      restored.entities.filter((entity) => entity.x === 5 && entity.y === 5)
        .map((entity) => entity.type),
      ["grass", type, "high-grass"],
    );
  }
});
