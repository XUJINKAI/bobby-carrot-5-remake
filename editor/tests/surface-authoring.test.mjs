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
  materializeSurfaceVariants,
  paintSurface,
  placeEntity,
  rectangleCells,
  resolveEditorPalette,
  serializeEditorLevel,
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

function autoMetadata(entity) {
  return Object.keys(entity?.properties ?? {}).filter((key) =>
    key.startsWith("__editorSurface"),
  );
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

test("Surface catalog follows the documented original material groups", () => {
  assert.equal(surfaceTerrain("stone-wall-1").rows.length, 3);
  assert.equal(surfaceTerrain("stone-wall-2").rows.length, 4);
  assert.equal(surfaceTerrain("mushroom").rows[0][0].type, "background-variant-062");
  assert.deepEqual(
    surfaceTerrain("waterfall").rows[0].map((variant) => variant.type),
    [
      "background-variant-092",
      "background-variant-093",
      "background-variant-094",
    ],
  );
  assert.deepEqual(
    surfaceTerrain("starfield").rows[0].map((variant) => variant.type),
    [
      "background-variant-072",
      "background-variant-073",
      "background-variant-074",
    ],
  );
});

test("documented Auto weights live in Surface data", () => {
  const water = surfaceTerrain("water").auto;
  assert.equal(water.kind, "weighted");
  assert.deepEqual(
    water.variants.map(({ type, weight }) => [type, weight]),
    [
      [EntityTypeId.WATER, 90],
      [EntityTypeId.WATER_ANIMATED, 10],
    ],
  );

  const starfield = surfaceTerrain("starfield").auto;
  assert.equal(starfield.kind, "weighted");
  assert.deepEqual(starfield.variants.map(({ weight }) => weight), [5, 10, 85]);
  assert.equal(surfaceTerrain("grass").auto.kind, "neighbor");
  assert.equal(surfaceTerrain("waterfall").auto.kind, "vertical");
  assert.equal(surfaceTerrain("wood-fence").auto.kind, "fence");
  assert.equal(surfaceTerrain("cactus").auto.kind, "paired-vertical");
});

test("wood Fence is a Surface overlay and preserves base terrain", () => {
  let level = createBlankLevel(5, 5);
  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    { terrain: "wood-fence", pattern: "auto", seed: 1 },
  ).apply(level);

  let cell = surfacesAt(level, 1, 1);
  assert.equal(cell.some((item) => item.terrain.slot === "base"), true);
  assert.equal(
    cell.some(
      (item) =>
        item.terrain.id === "wood-fence" && item.terrain.slot === "overlay",
    ),
    true,
  );

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
  assert.equal(cell.some((item) => item.terrain.id === "wood-fence"), true);
});

test("wood Fence supports Auto and explicit fixed variants", () => {
  const level = createBlankLevel(5, 5);
  const auto = paintSurface(
    catalog,
    [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    { terrain: "wood-fence", pattern: "auto", seed: 1 },
  ).apply(level);
  const autoFence = entityAt(auto, 1, 1, (entity) => entity.type === EntityTypeId.FENCE);
  assert.ok(autoFence);
  assert.equal(autoFence.state?.variant, undefined);
  assert.ok(autoMetadata(autoFence).length > 0);

  const exactType = surfaceTerrain("wood-fence").rows[0][2].type;
  const exact = paintSurface(
    catalog,
    [{ x: 3, y: 1 }],
    { terrain: "wood-fence", pattern: "exact", exact: exactType, seed: 1 },
  ).apply(auto);
  const exactFence = entityAt(exact, 3, 1, (entity) => entity.type === EntityTypeId.FENCE);
  assert.equal(exactFence?.state?.variant, 3);
  assert.deepEqual(autoMetadata(exactFence), []);
});

test("serialize materializes Auto Surface visuals and strips editor metadata", () => {
  const level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    { terrain: "wood-fence", pattern: "auto", seed: 9 },
  ).apply(createBlankLevel(5, 5));

  const materialized = materializeSurfaceVariants(level);
  for (const fence of materialized.entities.filter(
    (entity) => entity.type === EntityTypeId.FENCE,
  )) {
    assert.ok(Number.isInteger(fence.state?.variant));
    assert.deepEqual(autoMetadata(fence), []);
  }

  const serialized = serializeEditorLevel(level);
  assert.equal(serialized.includes("__editorSurfaceAuto"), false);
  assert.equal(serialized.includes("__editorSurfaceSeed"), false);
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

test("painting Surface replaces only its Surface slot and preserves stacked entities", () => {
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

test("solid raw Surface variants receive blocking gameplay traits", () => {
  const next = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    {
      terrain: "stone-wall-1",
      pattern: "exact",
      exact: "background-variant-004",
      seed: 1,
    },
  ).apply(createBlankLevel(4, 4));
  const entity = entityAt(next, 1, 1, (item) => item.type === "background-variant-004");
  assert.equal(entity?.traits?.includes("blocking"), true);
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

test("Auto Surface remains deterministic for the same seed and map context", () => {
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
    { terrain: "wood-fence", pattern: "auto", seed: 1 },
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

test("Waterfall Auto resolves vertical top middle bottom variants", () => {
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

test("Cactus Auto prefers a vertical pair when two painted cells are available", () => {
  const next = paintSurface(
    catalog,
    [{ x: 2, y: 1 }, { x: 2, y: 2 }],
    { terrain: "cactus", pattern: "auto", seed: 1 },
  ).apply(createBlankLevel(5, 5));
  assert.deepEqual(
    [entityAt(next, 2, 1)?.type, entityAt(next, 2, 2)?.type],
    ["background-variant-064", "background-variant-080"],
  );
});
