import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import {
  applySurfaceTheme,
  builtinEditorDefinition,
  createBlankLevel,
  detectSurfaceTheme,
  fillSurface,
  isSurfaceEntityType,
  paintSurface,
  placeEntity,
  rectangleCells,
  resolveEditorPalette,
  surfaceTerrain,
  surfaceTerrainForEntity,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

function entityAt(level, x, y, predicate = () => true) {
  return [...level.entities]
    .reverse()
    .find((entity) => entity.x === x && entity.y === y && predicate(entity));
}

function surfacesAt(level, x, y) {
  return level.entities
    .filter((entity) => entity.x === x && entity.y === y)
    .map((entity) => ({ entity, terrain: surfaceTerrainForEntity(entity.type) }))
    .filter((item) => item.terrain);
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

test("Surface terrain and variant layouts preserve explicit rows", () => {
  assert.equal(surfaceTerrain("stone-wall").rows.length, 4);
  assert.deepEqual(
    surfaceTerrain("waterfall").rows[0].map((variant) => variant.label),
    ["Start", "Middle", "End"],
  );
});

test("Fence is a Surface overlay and preserves the base terrain", () => {
  let level = createBlankLevel(5, 5);
  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    { terrain: "fence", pattern: "auto", seed: 1 },
  ).apply(level);

  let cell = surfacesAt(level, 1, 1);
  assert.equal(cell.some((item) => item.terrain.slot === "base"), true);
  assert.equal(cell.some((item) => item.terrain.id === "fence" && item.terrain.slot === "overlay"), true);

  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    {
      terrain: "snow-ground",
      pattern: "exact",
      exact: "walkable-variant-15",
      seed: 1,
    },
  ).apply(level);
  cell = surfacesAt(level, 1, 1);
  assert.equal(cell.some((item) => item.terrain.id === "snow-ground"), true);
  assert.equal(cell.some((item) => item.terrain.id === "fence"), true);
});

test("Surface Auto strategy is explicit data instead of implicit all-variant random", () => {
  assert.equal(surfaceTerrain("grass").auto.kind, "weighted");
  assert.equal(surfaceTerrain("stone-wall").auto.kind, "primary");
  assert.equal(surfaceTerrain("waterfall").auto.kind, "vertical");
  if (surfaceTerrain("grass").auto.kind === "weighted") {
    assert.ok(surfaceTerrain("grass").auto.variants.length < surfaceTerrain("grass").rows.flat().length);
  }
});

test("Palette mechanism placement preserves the Surface underneath", () => {
  const level = createBlankLevel(5, 5);
  const next = placeEntity(
    catalog,
    { type: EntityTypeId.SPEED, direction: "right" },
    { x: 1, y: 1 },
    {},
    builtinEditorDefinition,
  ).apply(level);

  const cell = next.entities.filter((entity) => entity.x === 1 && entity.y === 1);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.GROUND_C), true);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.SPEED), true);
});

test("painting Surface replaces only Surface and preserves stacked entities", () => {
  const level = createBlankLevel(5, 5);
  level.entities.push({ type: EntityTypeId.CARROT, x: 2, y: 2 });
  const next = paintSurface(
    catalog,
    [{ x: 2, y: 2 }],
    {
      terrain: "water",
      pattern: "exact",
      exact: EntityTypeId.WATER,
      seed: 1,
    },
  ).apply(level);

  const cell = next.entities.filter((entity) => entity.x === 2 && entity.y === 2);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.GROUND_C), false);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.WATER), true);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.CARROT), true);
});

test("Fill matches connected terrain while ignoring exact variant", () => {
  let level = createBlankLevel(5, 3);
  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    {
      terrain: "grass",
      pattern: "exact",
      exact: "walkable-variant-01",
      seed: 1,
    },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 2, y: 1 }],
    {
      terrain: "grass",
      pattern: "exact",
      exact: "walkable-variant-17",
      seed: 1,
    },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 3, y: 1 }],
    {
      terrain: "water",
      pattern: "exact",
      exact: EntityTypeId.WATER,
      seed: 1,
    },
  ).apply(level);

  const next = fillSurface(
    catalog,
    level,
    { x: 1, y: 1 },
    {
      terrain: "sand",
      pattern: "exact",
      exact: "walkable-variant-48",
      seed: 1,
    },
  ).apply(level);

  assert.equal(
    surfaceTerrainForEntity(entityAt(next, 1, 1, (entity) => isSurfaceEntityType(entity.type))?.type)?.id,
    "sand",
  );
  assert.equal(
    surfaceTerrainForEntity(entityAt(next, 2, 1, (entity) => isSurfaceEntityType(entity.type))?.type)?.id,
    "sand",
  );
  assert.equal(entityAt(next, 3, 1, (entity) => isSurfaceEntityType(entity.type))?.type, EntityTypeId.WATER);
});

test("Alternate Surface pattern is a stable coordinate checker", () => {
  const level = createBlankLevel(4, 4);
  const next = paintSurface(
    catalog,
    rectangleCells({ x: 0, y: 0 }, { x: 1, y: 1 }),
    {
      terrain: "grass",
      pattern: "alternate",
      alternate: ["walkable-variant-01", "walkable-variant-02"],
      seed: 1,
    },
  ).apply(level);

  const surface = (x, y) =>
    entityAt(next, x, y, (entity) => isSurfaceEntityType(entity.type))?.type;
  assert.equal(surface(0, 0), "walkable-variant-01");
  assert.equal(surface(1, 0), "walkable-variant-02");
  assert.equal(surface(0, 1), "walkable-variant-02");
  assert.equal(surface(1, 1), "walkable-variant-01");
});

test("Auto Surface is deterministic for the same seed", () => {
  const level = createBlankLevel(4, 4);
  const cells = rectangleCells({ x: 0, y: 0 }, { x: 3, y: 3 });
  const brush = { terrain: "grass", pattern: "auto", seed: 37 };
  const a = paintSurface(catalog, cells, brush).apply(level);
  const b = paintSurface(catalog, cells, brush).apply(level);
  assert.deepEqual(a.entities, b.entities);
});

test("Theme switch changes only recognized visual families", () => {
  let level = createBlankLevel(4, 2);
  level = paintSurface(
    catalog,
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    { terrain: "grass", pattern: "auto", seed: 1 },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 2, y: 0 }],
    { terrain: "fence", pattern: "auto", seed: 1 },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 3, y: 0 }],
    { terrain: "water", pattern: "exact", exact: EntityTypeId.WATER, seed: 1 },
  ).apply(level);

  assert.equal(detectSurfaceTheme(level), "forest");
  const next = applySurfaceTheme(catalog, "snow").apply(level);
  assert.equal(detectSurfaceTheme(next), "snow");
  assert.equal(surfaceTerrainForEntity(entityAt(next, 0, 0)?.type)?.id, "snow-ground");
  assert.equal(
    surfacesAt(next, 2, 0).some((item) => item.terrain.id === "snow-fence"),
    true,
  );
  assert.equal(entityAt(next, 3, 0)?.type, EntityTypeId.WATER);
});

test("Waterfall Auto resolves vertical Start Middle End variants", () => {
  const level = createBlankLevel(5, 5);
  const next = paintSurface(
    catalog,
    [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    { terrain: "waterfall", pattern: "auto", seed: 1 },
  ).apply(level);
  const surface = (y) =>
    entityAt(next, 2, y, (entity) => isSurfaceEntityType(entity.type))?.type;
  assert.deepEqual([surface(1), surface(2), surface(3)], [
    "background-variant-092",
    "background-variant-093",
    "background-variant-094",
  ]);
});
