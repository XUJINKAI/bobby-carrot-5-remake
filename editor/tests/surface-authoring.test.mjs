import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  MapEntityTypeId,
  originalTileCoordinateLabel,
  originalTileVisualGroup,
} from "@bobby/model";
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
  return Object.keys(entity ?? {}).filter((key) =>
    key.startsWith("__editorSurface"),
  );
}

test("Surface catalog is independent from Palette", () => {
  assert.equal(isSurfaceEntityType(EntityTypeId.WATER), true);
  assert.equal(isSurfaceEntityType(EntityTypeId.ICE), true);
  assert.equal(isSurfaceEntityType("ts-7-1"), true);
  assert.equal(isSurfaceEntityType(EntityTypeId.SPEED), false);

  const palette = resolveEditorPalette(catalog, builtinEditorDefinition)
    .flatMap((group) => group.rows.flat());
  assert.equal(palette.some((item) => item.type === EntityTypeId.WATER), false);
  assert.equal(palette.some((item) => item.type === EntityTypeId.ICE), false);
  assert.equal(palette.some((item) => item.type === EntityTypeId.SPEED), true);
});

test("Surface catalog follows the documented original material groups", () => {
  assert.deepEqual(
    surfaceTerrain("stone-wall").rows.flat().map((item) => item.type).toSorted(),
    originalTileVisualGroup("stone-wall").visuals
      .map(originalTileCoordinateLabel)
      .toSorted(),
  );
  assert.deepEqual(
    surfaceTerrain("snow-cloud").rows.flat().map((item) => item.type).toSorted(),
    originalTileVisualGroup("snow-cloud").visuals
      .map(originalTileCoordinateLabel)
      .toSorted(),
  );
  assert.equal(surfaceTerrain("mushroom").rows[0][0].type, "ts-4-14");
  assert.deepEqual(
    surfaceTerrain("waterfall").rows[0].map((variant) => variant.type),
    [
      "ts-6-12",
      "ts-6-13",
      "ts-6-14",
    ],
  );
  assert.deepEqual(
    surfaceTerrain("starfield").rows[0].map((variant) => variant.type),
    [
      "ts-5-8",
      "ts-5-9",
      "ts-5-10",
    ],
  );
});

test("documented Auto weights live in Surface data", () => {
  const water = surfaceTerrain("water").auto;
  assert.equal(water.kind, "weighted");
  assert.deepEqual(
    water.variants.map(({ type, weight }) => [type, weight]),
    [
      ["ts-6-6", 90],
      ["ts-6-7", 10],
    ],
  );

  const starfield = surfaceTerrain("starfield").auto;
  assert.equal(starfield.kind, "weighted");
  assert.deepEqual(starfield.variants.map(({ weight }) => weight), [5, 10, 85]);
  assert.equal(surfaceTerrain("grass").auto.kind, "neighbor");
  assert.equal(surfaceTerrain("waterfall").auto.kind, "vertical");
  assert.equal(surfaceTerrain("fence").auto.kind, "fence");
  assert.equal(surfaceTerrain("cactus").auto.kind, "weighted");
});

test("Fence is a Surface overlay and preserves base terrain", () => {
  let level = createBlankLevel(5, 5);
  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    { terrain: "fence", pattern: "auto", seed: 1 },
  ).apply(level);

  let cell = surfacesAt(level, 1, 1);
  assert.equal(cell.some((item) => item.terrain.slot === "base"), true);
  assert.equal(
    cell.some(
      (item) =>
        item.terrain.id === "fence" && item.terrain.slot === "overlay",
    ),
    true,
  );

  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    {
      terrain: "snow-cloud",
      pattern: "exact",
      exact: "ts-7-15",
      seed: 1,
    },
  ).apply(level);
  cell = surfacesAt(level, 1, 1);
  assert.equal(cell.some((item) => item.terrain.id === "snow-cloud"), true);
  assert.equal(cell.some((item) => item.terrain.id === "fence"), true);
});

test("Fence supports Auto and explicit fixed variants", () => {
  const level = createBlankLevel(5, 5);
  const auto = paintSurface(
    catalog,
    [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    { terrain: "fence", pattern: "auto", seed: 1 },
  ).apply(level);
  const autoFence = entityAt(auto, 1, 1, (entity) => entity.type === EntityTypeId.FENCE);
  assert.ok(autoFence);
  assert.match(autoFence.variant, /^ts-16-(?:1[0-5])$/);
  assert.ok(autoMetadata(autoFence).length > 0);

  const exactType = surfaceTerrain("fence").rows[0][2].type;
  const exact = paintSurface(
    catalog,
    [{ x: 3, y: 1 }],
    { terrain: "fence", pattern: "exact", exact: exactType, seed: 1 },
  ).apply(auto);
  const exactFence = entityAt(exact, 3, 1, (entity) => entity.type === EntityTypeId.FENCE);
  assert.equal(exactFence?.variant, "ts-16-12");
  assert.deepEqual(autoMetadata(exactFence), []);
});

test("serialize materializes Auto Surface visuals and strips editor metadata", () => {
  const level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    { terrain: "fence", pattern: "auto", seed: 9 },
  ).apply(createBlankLevel(5, 5));

  const materialized = materializeSurfaceVariants(level);
  for (const fence of materialized.entities.filter(
    (entity) => entity.type === EntityTypeId.FENCE,
  )) {
    assert.match(fence.variant, /^ts-16-(?:1[0-5])$/);
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
  assert.equal(cell.some((entity) => entity.type === MapEntityTypeId.GRASS), true);
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
      exact: "ts-6-6",
      seed: 1,
    },
  ).apply(level);

  const cell = next.entities.filter((entity) => entity.x === 2 && entity.y === 2);
  assert.equal(cell.some((entity) => entity.type === "grass"), false);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.WATER), true);
  assert.equal(cell.some((entity) => entity.type === EntityTypeId.CARROT), true);
});

test("Surface instances leave gameplay semantics to Engine definitions", () => {
  const next = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    {
      terrain: "stone-wall",
      pattern: "exact",
      exact: "ts-1-4",
      seed: 1,
    },
  ).apply(createBlankLevel(4, 4));
  const entity = entityAt(next, 1, 1, (item) => item.type === "stone-wall");
  assert.equal(entity?.traits, undefined);
  assert.equal(entity?.variant, "ts-1-4");
});

test("Fill matches connected terrain while ignoring exact variant", () => {
  let level = createBlankLevel(5, 3);
  level = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    {
      terrain: "grass",
      pattern: "exact",
      exact: "ts-7-1",
      seed: 1,
    },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 2, y: 1 }],
    {
      terrain: "grass",
      pattern: "exact",
      exact: "ts-8-1",
      seed: 1,
    },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 3, y: 1 }],
    {
      terrain: "water",
      pattern: "exact",
      exact: "ts-6-6",
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
      exact: "ts-9-16",
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
      alternate: ["ts-7-1", "ts-7-2"],
      seed: 1,
    },
  ).apply(level);

  const surface = (x, y) =>
    entityAt(next, x, y, (entity) => isSurfaceEntityType(entity.type));
  assert.equal(surface(0, 0)?.variant, "ts-7-1");
  assert.equal(surface(1, 0)?.variant, "ts-7-2");
  assert.equal(surface(0, 1)?.variant, "ts-7-2");
  assert.equal(surface(1, 1)?.variant, "ts-7-1");
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
    { terrain: "fence", pattern: "auto", seed: 1 },
  ).apply(level);
  level = paintSurface(
    catalog,
    [{ x: 3, y: 0 }],
    { terrain: "water", pattern: "exact", exact: "ts-6-6", seed: 1 },
  ).apply(level);

  assert.equal(detectSurfaceTheme(level), "forest");
  const next = applySurfaceTheme(catalog, "snow").apply(level);
  assert.equal(detectSurfaceTheme(next), "snow");
  assert.equal(surfaceTerrainForEntity(entityAt(next, 0, 0)?.type)?.id, "snow-cloud");
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
    entityAt(next, 2, y, (entity) => isSurfaceEntityType(entity.type))?.variant;
  assert.deepEqual([surface(1), surface(2), surface(3)], [
    "top",
    "middle",
    "bottom",
  ]);
});

test("Cactus Auto stays cell-local", () => {
  const next = paintSurface(
    catalog,
    [{ x: 2, y: 1 }, { x: 2, y: 2 }],
    { terrain: "cactus", pattern: "auto", seed: 1 },
  ).apply(createBlankLevel(5, 5));
  const variants = [entityAt(next, 2, 1)?.variant, entityAt(next, 2, 2)?.variant];
  for (const variant of variants) assert.ok(variant === "small" || variant === "round");
});
