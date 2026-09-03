import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import {
  createBlankLevel,
  fillSurface,
  isSurfaceEntityType,
  paintSurface,
  rectangleCells,
  resolveEditorPalette,
  builtinEditorDefinition,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

function entityAt(level, x, y, predicate = () => true) {
  return [...level.entities]
    .reverse()
    .find((entity) => entity.x === x && entity.y === y && predicate(entity));
}

test("Surface catalog is independent from Palette", () => {
  assert.equal(isSurfaceEntityType(EntityTypeId.WATER), true);
  assert.equal(isSurfaceEntityType(EntityTypeId.ICE), true);
  assert.equal(isSurfaceEntityType("walkable-variant-01"), true);
  assert.equal(isSurfaceEntityType(EntityTypeId.SPEED), false);

  const palette = resolveEditorPalette(catalog, builtinEditorDefinition)
    .flatMap((group) => group.rows.flat());
  assert.equal(palette.some((item) => item.type === EntityTypeId.WATER), false);
  assert.equal(palette.some((item) => item.type === EntityTypeId.ICE), false);
  assert.equal(palette.some((item) => item.type === EntityTypeId.SPEED), true);
});

test("painting Surface replaces only Surface and preserves stacked entities", () => {
  const level = createBlankLevel(5, 5);
  level.entities.push({ type: EntityTypeId.CARROT, x: 2, y: 2 });
  const next = paintSurface(
    catalog,
    [{ x: 2, y: 2 }],
    { type: "water", theme: "shared", pattern: "exact", exact: EntityTypeId.WATER, seed: 1 },
  ).apply(level);

  const cell = next.entities.filter((entity) => entity.x === 2 && entity.y === 2);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.GROUND_C), false);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.WATER), true);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.CARROT), true);
});

test("Fill matches connected semantic Surface while ignoring exact variant", () => {
  let level = createBlankLevel(5, 3);
  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    { type: "ground", theme: "forest", pattern: "exact", exact: "walkable-variant-01", seed: 1 },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 2, y: 1 }],
    { type: "ground", theme: "forest", pattern: "exact", exact: "walkable-variant-17", seed: 1 },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 3, y: 1 }],
    { type: "water", theme: "shared", pattern: "exact", exact: EntityTypeId.WATER, seed: 1 },
  ).apply(level);

  const next = fillSurface(
    catalog,
    level,
    { x: 1, y: 1 },
    { type: "ground", theme: "desert", pattern: "exact", exact: "walkable-variant-48", seed: 1 },
  ).apply(level);

  assert.equal(entityAt(next, 1, 1, (entity) => isSurfaceEntityType(entity.type))?.type, "walkable-variant-48");
  assert.equal(entityAt(next, 2, 1, (entity) => isSurfaceEntityType(entity.type))?.type, "walkable-variant-48");
  assert.equal(entityAt(next, 3, 1, (entity) => isSurfaceEntityType(entity.type))?.type, EntityTypeId.WATER);
});

test("Alternate Surface pattern is a stable coordinate checker", () => {
  const level = createBlankLevel(4, 4);
  const next = paintSurface(
    catalog,
    rectangleCells({ x: 0, y: 0 }, { x: 1, y: 1 }),
    {
      type: "ground",
      theme: "forest",
      pattern: "alternate",
      alternate: ["walkable-variant-01", "walkable-variant-02"],
      seed: 1,
    },
  ).apply(level);

  const surface = (x, y) => entityAt(next, x, y, (entity) => isSurfaceEntityType(entity.type))?.type;
  assert.equal(surface(0, 0), "walkable-variant-01");
  assert.equal(surface(1, 0), "walkable-variant-02");
  assert.equal(surface(0, 1), "walkable-variant-02");
  assert.equal(surface(1, 1), "walkable-variant-01");
});

test("Auto Surface is deterministic for the same seed", () => {
  const level = createBlankLevel(4, 4);
  const cells = rectangleCells({ x: 0, y: 0 }, { x: 3, y: 3 });
  const brush = { type: "ground", theme: "forest", pattern: "auto", seed: 37 };
  const a = paintSurface(catalog, cells, brush).apply(level);
  const b = paintSurface(catalog, cells, brush).apply(level);
  assert.deepEqual(a.entities, b.entities);
});

test("Waterfall Auto resolves vertical Start Middle End variants", () => {
  const level = createBlankLevel(5, 5);
  const next = paintSurface(
    catalog,
    [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    { type: "waterfall", theme: "shared", pattern: "auto", seed: 1 },
  ).apply(level);
  const surface = (y) => entityAt(next, 2, y, (entity) => isSurfaceEntityType(entity.type))?.type;
  assert.deepEqual([surface(1), surface(2), surface(3)], [
    "background-variant-182",
    "background-variant-198",
    "background-variant-214",
  ]);
});
