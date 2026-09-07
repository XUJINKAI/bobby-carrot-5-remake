import type { EntityCatalog } from "@bobby/engine";
import {
  EntityTypeId,
  MapEntityTypeId,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import {
  LEGACY_GROUND_TYPES,
  SURFACE_TERRAIN_GROUPS,
  SURFACE_TERRAINS,
  SURFACE_THEMES,
  type SurfaceAutoDefinition,
  type SurfaceBrush,
  type SurfacePattern,
  type SurfaceSlot,
  type SurfaceTerrainDefinition,
  type SurfaceTerrainGroup,
  type SurfaceTerrainId,
  type SurfaceTheme,
  type SurfaceThemeDefinition,
  type SurfaceTool,
  type SurfaceType,
  type SurfaceVariant,
  type SurfaceWeightedVariant,
} from "../definitions/surface.js";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap } from "../level/types.js";
import type { Cell } from "./entityPlacement.js";

export {
  SURFACE_TERRAIN_GROUPS,
  SURFACE_TERRAINS,
  SURFACE_THEMES,
};
export type {
  SurfaceAutoDefinition,
  SurfaceBrush,
  SurfacePattern,
  SurfaceSlot,
  SurfaceTerrainDefinition,
  SurfaceTerrainGroup,
  SurfaceTerrainId,
  SurfaceTheme,
  SurfaceThemeDefinition,
  SurfaceTool,
  SurfaceType,
  SurfaceVariant,
};

type ConcreteSurfaceTheme = Exclude<SurfaceTheme, "mixed">;

const AUTO_TERRAIN_KEY = "__editorSurfaceAuto";
const AUTO_SEED_KEY = "__editorSurfaceSeed";

const terrainById = new Map(
  SURFACE_TERRAINS.map((definition) => [definition.id, definition] as const),
);
const terrainByEntityType = new Map<EntityType, SurfaceTerrainDefinition>();
for (const terrain of SURFACE_TERRAINS)
  for (const variant of terrain.rows.flat())
    terrainByEntityType.set(variant.type, terrain);

const woodFenceTerrain = terrainById.get("wood-fence");
if (woodFenceTerrain)
  terrainByEntityType.set(EntityTypeId.FENCE, woodFenceTerrain);

const semanticTerrainTypes: readonly [EntityType, SurfaceTerrainId][] = [
  [MapEntityTypeId.WATER, "water"],
  [MapEntityTypeId.WATER_RIPPLE, "water"],
  [MapEntityTypeId.WATERFALL, "waterfall"],
  [MapEntityTypeId.STARFIELD, "starfield"],
  [MapEntityTypeId.MOON, "moon"],
  [MapEntityTypeId.CLOUD_LAYER, "cloud"],
  [MapEntityTypeId.GRASS, "grass"],
  [MapEntityTypeId.WOOD_FENCE, "wood-fence"],
  [MapEntityTypeId.HEDGE, "hedge"],
  [MapEntityTypeId.TREE, "tree"],
  [MapEntityTypeId.STONE_WALL_1, "stone-wall-1"],
  [MapEntityTypeId.STONE_WALL_2, "stone-wall-2"],
  [MapEntityTypeId.STUMP, "stump"],
  [MapEntityTypeId.FLOWER_POT, "flower-pot"],
  [MapEntityTypeId.ROCK, "stone"],
  [MapEntityTypeId.MUSHROOM, "mushroom"],
  [MapEntityTypeId.SNOWMAN, "snowman"],
  [MapEntityTypeId.CANDY_CANE, "christmas-cane"],
  [MapEntityTypeId.CHRISTMAS_TREE, "christmas-tree"],
  [MapEntityTypeId.SNOW_FENCE, "snow-fence"],
  [MapEntityTypeId.SNOWY_ROCK, "snow-rock"],
  [MapEntityTypeId.SNOW_GROUND, "snow-ground"],
  [MapEntityTypeId.CACTUS, "cactus"],
  [MapEntityTypeId.SAND, "sand"],
  [MapEntityTypeId.ICE, "ice"],
];
for (const [type, terrainId] of semanticTerrainTypes) {
  const terrain = terrainById.get(terrainId);
  if (terrain) terrainByEntityType.set(type, terrain);
}

const surfaceTypes = new Set<EntityType>(terrainByEntityType.keys());
for (const type of LEGACY_GROUND_TYPES) surfaceTypes.add(type);

export function isSurfaceEntityType(type: EntityType): boolean {
  return surfaceTypes.has(type) || /^surface-\d+-\d+$/.test(type);
}

export function surfaceTerrain(id: SurfaceTerrainId): SurfaceTerrainDefinition {
  const result = terrainById.get(id);
  if (!result) throw new Error(`Unknown Surface terrain: ${id}`);
  return result;
}

export function surfaceTerrainForEntity(
  type: EntityType,
): SurfaceTerrainDefinition | null {
  if (LEGACY_GROUND_TYPES.has(type)) return surfaceTerrain("grass");
  return terrainByEntityType.get(type) ?? null;
}

export function defaultSurfaceBrush(): SurfaceBrush {
  return { terrain: "grass", pattern: "auto", seed: 1 };
}

export function detectSurfaceTheme(level: Readonly<EditorMap>): SurfaceTheme {
  const themes = new Set<ConcreteSurfaceTheme>();
  for (const entity of level.entities) {
    const item = surfaceTerrainForEntity(entity.type);
    if (item?.themeFamily && item.theme) themes.add(item.theme);
    if (themes.size > 1) return "mixed";
  }
  return themes.values().next().value ?? "mixed";
}

export function applySurfaceTheme(
  catalog: EntityCatalog,
  theme: SurfaceTheme,
): EditorCommand {
  return {
    apply(level) {
      if (theme === "mixed") return level;
      let changed = false;
      const sourceLevel = level as EditorMap;
      const entities = level.entities.map((entity) => {
        const source = surfaceTerrainForEntity(entity.type);
        if (!source?.themeFamily || source.theme === theme) return entity;
        const target = SURFACE_TERRAINS.find(
          (candidate) =>
            candidate.themeFamily === source.themeFamily &&
            candidate.theme === theme &&
            candidate.type === source.type &&
            candidate.slot === source.slot,
        );
        if (!target) return entity;
        changed = true;
        const auto = autoMetadata(entity);
        if (auto) {
          return createSurfaceEntity(
            catalog,
            { terrain: target.id, pattern: "auto", seed: auto.seed },
            entity,
            new Set(),
            sourceLevel,
          ) ?? entity;
        }
        return applySurfaceInstanceTraits(
          { ...stripAutoMetadata(entity), type: target.primary },
          target,
        );
      });
      return changed ? normalizeEditorLevel({ ...level, entities }) : level;
    },
  };
}

export function paintSurface(
  catalog: EntityCatalog,
  cells: readonly Cell[],
  brush: SurfaceBrush,
): EditorCommand {
  return {
    apply(level) {
      const target = new Set(
        cells.filter((cell) => inBounds(level, cell)).map(cellKey),
      );
      if (target.size === 0) return level;
      const terrain = surfaceTerrain(brush.terrain);
      const slot = terrain.slot;
      const kept = level.entities.filter((entity) => {
        if (!target.has(cellKey(entity))) return true;
        return surfaceTerrainForEntity(entity.type)?.slot !== slot;
      });
      const sourceLevel = { ...level, entities: kept } as EditorMap;
      const painted = [...target]
        .map((key) =>
          createSurfaceEntity(
            catalog,
            brush,
            parseCellKey(key),
            target,
            sourceLevel,
          ),
        )
        .filter((entity): entity is LevelEntity => entity !== null);
      const next = normalizeEditorLevel({
        ...level,
        entities: [...kept, ...painted],
      });
      return reflowAutoSurfaces(catalog, next);
    },
  };
}

export function fillSurface(
  catalog: EntityCatalog,
  level: Readonly<EditorMap>,
  origin: Cell,
  brush: SurfaceBrush,
): EditorCommand {
  const targetTerrain = surfaceTerrain(brush.terrain);
  const source = surfaceAt(level, origin, targetTerrain.slot);
  const sourceTerrain = source ? surfaceTerrainForEntity(source.type) : null;
  if (!sourceTerrain) return paintSurface(catalog, [origin], brush);

  const cells: Cell[] = [];
  const visited = new Set<string>();
  const queue: Cell[] = [origin];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = cellKey(cell);
    if (visited.has(key) || !inBounds(level, cell)) continue;
    visited.add(key);
    const entity = surfaceAt(level, cell, sourceTerrain.slot);
    const item = entity ? surfaceTerrainForEntity(entity.type) : null;
    if (!item || item.id !== sourceTerrain.id) continue;
    cells.push(cell);
    queue.push(
      { x: cell.x - 1, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x, y: cell.y + 1 },
    );
  }
  return paintSurface(catalog, cells, brush);
}

export function rectangleCells(anchor: Cell, focus: Cell): Cell[] {
  const left = Math.min(anchor.x, focus.x);
  const right = Math.max(anchor.x, focus.x);
  const top = Math.min(anchor.y, focus.y);
  const bottom = Math.max(anchor.y, focus.y);
  const cells: Cell[] = [];
  for (let y = top; y <= bottom; y += 1)
    for (let x = left; x <= right; x += 1) cells.push({ x, y });
  return cells;
}

export function pickSurfaceBrush(
  level: Readonly<EditorMap>,
  cell: Cell,
): SurfaceBrush | null {
  const entity =
    surfaceAt(level, cell, "overlay") ?? surfaceAt(level, cell, "base");
  if (!entity) return null;
  const item = surfaceTerrainForEntity(entity.type);
  if (!item) return null;
  const auto = autoMetadata(entity);
  if (auto) return { terrain: item.id, pattern: "auto", seed: auto.seed };

  if (item.id === "wood-fence" && entity.type === EntityTypeId.FENCE) {
    const variant = Number(entity.variant);
    const variants = item.rows.flat();
    const selected =
      Number.isInteger(variant) && variant >= 1 && variant <= variants.length
        ? variants[variant - 1]?.type
        : undefined;
    if (selected)
      return { terrain: item.id, pattern: "exact", exact: selected, seed: 1 };
  }

  return {
    terrain: item.id,
    pattern: "exact",
    exact: entity.type,
    seed: 1,
  };
}

/**
 * 导出/分享时把 Editor 内可重算的 Auto Surface 固化成当前 visual。
 * 下次打开文件时没有 Auto metadata，因此不会因为邻居或 hash 再变化。
 */
export function materializeSurfaceVariants(level: EditorMap): EditorMap {
  const entities = level.entities.map((entity) => {
    const auto = autoMetadata(entity);
    if (!auto) return stripAutoMetadata(entity);
    const terrain = surfaceTerrainForEntity(entity.type);
    let fixed = stripAutoMetadata(entity);
    if (terrain?.id === "wood-fence" && entity.type === EntityTypeId.FENCE) {
      const index = fenceVariantIndex(level, entity, terrain);
      fixed = { ...fixed, variant: `ts-16-${index + 10}` };
    }
    return fixed;
  });
  return normalizeEditorLevel({ ...level, entities });
}

function createSurfaceEntity(
  catalog: EntityCatalog,
  brush: SurfaceBrush,
  cell: Cell,
  target: ReadonlySet<string>,
  level: Readonly<EditorMap>,
): LevelEntity | null {
  const item = surfaceTerrain(brush.terrain);
  const variants = item.rows.flat();
  if (variants.length === 0) return null;

  if (
    brush.pattern === "exact" &&
    brush.exact &&
    variants.some((variant) => variant.type === brush.exact)
  ) {
    return createFixedSurfaceEntity(catalog, item, brush.exact, cell);
  }
  if (
    brush.pattern === "alternate" &&
    brush.alternate &&
    brush.alternate.every((candidate) =>
      variants.some((variant) => variant.type === candidate),
    )
  ) {
    return createFixedSurfaceEntity(
      catalog,
      item,
      brush.alternate[(cell.x + cell.y) & 1]!,
      cell,
    );
  }

  const type = resolveAutoType(item, cell, brush.seed, target, level);
  let entity: LevelEntity;
  if (item.auto.kind === "fence" && item.auto.canonical) {
    entity = { type: item.auto.canonical, x: cell.x, y: cell.y };
  } else {
    entity = { type, x: cell.x, y: cell.y };
  }
  catalog.require(entity.type);
  return markAuto(applySurfaceInstanceTraits(entity, item), item.id, brush.seed);
}

function createFixedSurfaceEntity(
  catalog: EntityCatalog,
  terrain: SurfaceTerrainDefinition,
  selectedType: EntityType,
  cell: Cell,
): LevelEntity {
  if (terrain.auto.kind === "fence" && terrain.auto.canonical) {
    const index = terrain.auto.variants.indexOf(selectedType);
    const entity: LevelEntity = {
      type: terrain.auto.canonical,
      x: cell.x,
      y: cell.y,
      ...(index >= 0 ? { variant: `ts-16-${index + 10}` } : {}),
    };
    catalog.require(entity.type);
    return applySurfaceInstanceTraits(entity, terrain);
  }
  catalog.require(selectedType);
  return applySurfaceInstanceTraits(
    { type: selectedType, x: cell.x, y: cell.y },
    terrain,
  );
}

function resolveAutoType(
  terrain: SurfaceTerrainDefinition,
  cell: Cell,
  seed: number,
  target: ReadonlySet<string>,
  level: Readonly<EditorMap>,
): EntityType {
  const auto = terrain.auto;
  if (auto.kind === "primary") return terrain.primary;
  if (auto.kind === "vertical") {
    const above = targetHasTerrain(level, target, terrain.id, {
      x: cell.x,
      y: cell.y - 1,
    });
    const below = targetHasTerrain(level, target, terrain.id, {
      x: cell.x,
      y: cell.y + 1,
    });
    return !above ? auto.start : !below ? auto.end : auto.middle;
  }
  if (auto.kind === "fence") {
    return auto.variants[fenceVariantIndex(level, cell, terrain, target)] ?? terrain.primary;
  }
  if (auto.kind === "neighbor") {
    const neighboring = neighborTerrainIds(level, target, terrain.id, cell);
    const rule = auto.rules.find((candidate) =>
      candidate.neighborTerrains.some((id) => neighboring.has(id)),
    );
    const variants = rule?.variants ?? auto.fallback;
    return weightedVariant(
      variants,
      hashCell(cell, seed + (auto.salt ?? 0)),
      terrain.primary,
    );
  }
  if (auto.kind === "paired-vertical") {
    return weightedVariant(
      auto.singles,
      hashCell(cell, seed + (auto.salt ?? 0)),
      terrain.primary,
    );
  }
  return weightedVariant(
    auto.variants,
    hashCell(cell, seed + (auto.salt ?? 0)),
    terrain.primary,
  );
}

function reflowAutoSurfaces(
  catalog: EntityCatalog,
  level: EditorMap,
): EditorMap {
  const autoCellsByTerrain = new Map<SurfaceTerrainId, Set<string>>();
  for (const entity of level.entities) {
    const auto = autoMetadata(entity);
    if (!auto) continue;
    const set = autoCellsByTerrain.get(auto.terrain) ?? new Set<string>();
    set.add(cellKey(entity));
    autoCellsByTerrain.set(auto.terrain, set);
  }
  if (autoCellsByTerrain.size === 0) return level;

  let changed = false;
  const entities = level.entities.map((entity) => {
    const metadata = autoMetadata(entity);
    if (!metadata) return entity;
    const terrain = surfaceTerrain(metadata.terrain);
    if (terrain.auto.kind === "fence" && terrain.auto.canonical) return entity;
    const target = autoCellsByTerrain.get(metadata.terrain) ?? new Set<string>();
    const type = resolveAutoType(
      terrain,
      entity,
      metadata.seed,
      target,
      level,
    );
    if (type === entity.type) return entity;
    catalog.require(type);
    changed = true;
    return markAuto(
      applySurfaceInstanceTraits({ ...entity, type }, terrain),
      terrain.id,
      metadata.seed,
    );
  });
  return changed ? normalizeEditorLevel({ ...level, entities }) : level;
}

/** Map JSON never carries gameplay trait overrides; Engine owns surface semantics. */
function applySurfaceInstanceTraits(
  entity: LevelEntity,
  _terrain: SurfaceTerrainDefinition,
): LevelEntity {
  return entity;
}

function weightedVariant(
  variants: readonly SurfaceWeightedVariant[],
  hash: number,
  fallback: EntityType,
): EntityType {
  const entries = variants.filter((variant) => variant.weight > 0);
  if (entries.length === 0) return fallback;
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  let target = hash % total;
  for (const item of entries) {
    target -= item.weight;
    if (target < 0) return item.type;
  }
  return entries[0]?.type ?? fallback;
}

function neighborTerrainIds(
  level: Readonly<EditorMap>,
  target: ReadonlySet<string>,
  targetTerrain: SurfaceTerrainId,
  cell: Cell,
): Set<SurfaceTerrainId> {
  const result = new Set<SurfaceTerrainId>();
  for (const neighbor of cardinalNeighbors(cell)) {
    if (target.has(cellKey(neighbor))) {
      result.add(targetTerrain);
      continue;
    }
    for (const slot of ["overlay", "base"] as const) {
      const entity = surfaceAt(level, neighbor, slot);
      const terrain = entity ? surfaceTerrainForEntity(entity.type) : null;
      if (terrain) result.add(terrain.id);
    }
  }
  return result;
}

function fenceVariantIndex(
  level: Readonly<EditorMap>,
  cell: Cell,
  terrain: SurfaceTerrainDefinition,
  target: ReadonlySet<string> = new Set(),
): number {
  const connectedAt = (neighbor: Cell): boolean => {
    if (!inBounds(level, neighbor)) return true;
    if (target.has(cellKey(neighbor))) return true;
    return level.entities.some((entity) => {
      if (entity.x !== neighbor.x || entity.y !== neighbor.y) return false;
      return surfaceTerrainForEntity(entity.type)?.id === terrain.id;
    });
  };
  const left = connectedAt({ x: cell.x - 1, y: cell.y });
  const down = connectedAt({ x: cell.x, y: cell.y + 1 });
  const right = connectedAt({ x: cell.x + 1, y: cell.y });
  const up = connectedAt({ x: cell.x, y: cell.y - 1 });
  if (!left && down && !right) return 1;
  if (left && !down && !right) return 2;
  if (!left && down && right) return 3;
  if (left && down && !right) return 4;
  if (!left && !down && right) return 5;
  if (up && !left && !right) return 1;
  return 0;
}

function targetHasTerrain(
  level: Readonly<EditorMap>,
  target: ReadonlySet<string>,
  terrain: SurfaceTerrainId,
  cell: Cell,
): boolean {
  if (target.has(cellKey(cell))) return true;
  if (!inBounds(level, cell)) return false;
  return (["overlay", "base"] as const).some((slot) => {
    const entity = surfaceAt(level, cell, slot);
    return entity ? surfaceTerrainForEntity(entity.type)?.id === terrain : false;
  });
}

function cardinalNeighbors(cell: Cell): Cell[] {
  return [
    { x: cell.x - 1, y: cell.y },
    { x: cell.x + 1, y: cell.y },
    { x: cell.x, y: cell.y - 1 },
    { x: cell.x, y: cell.y + 1 },
  ];
}

function markAuto(
  entity: LevelEntity,
  terrain: SurfaceTerrainId,
  seed: number,
): LevelEntity {
  return {
    ...entity,
    [AUTO_TERRAIN_KEY]: terrain,
    [AUTO_SEED_KEY]: seed,
  };
}

function autoMetadata(
  entity: Readonly<LevelEntity>,
): { terrain: SurfaceTerrainId; seed: number } | null {
  const rawTerrain = entity[AUTO_TERRAIN_KEY];
  if (typeof rawTerrain !== "string" || !terrainById.has(rawTerrain as SurfaceTerrainId))
    return null;
  const rawSeed = Number(entity[AUTO_SEED_KEY]);
  return {
    terrain: rawTerrain as SurfaceTerrainId,
    seed: Number.isFinite(rawSeed) ? rawSeed : 1,
  };
}

function stripAutoMetadata(entity: Readonly<LevelEntity>): LevelEntity {
  const next = { ...structuredClone(entity) };
  delete next[AUTO_TERRAIN_KEY];
  delete next[AUTO_SEED_KEY];
  return next;
}

function hashCell(cell: Cell, seed: number): number {
  let value =
    Math.imul(cell.x + 0x9e3779b9, 0x85ebca6b) ^
    Math.imul(cell.y + seed, 0xc2b2ae35);
  value ^= value >>> 16;
  return value >>> 0;
}

function surfaceAt(
  level: Readonly<EditorMap>,
  cell: Cell,
  slot: SurfaceSlot,
): Readonly<LevelEntity> | null {
  return (
    [...level.entities]
      .reverse()
      .find((entity) => {
        if (entity.x !== cell.x || entity.y !== cell.y) return false;
        return surfaceTerrainForEntity(entity.type)?.slot === slot;
      }) ?? null
  );
}

function inBounds(level: Readonly<EditorMap>, cell: Cell): boolean {
  return (
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x < level.width &&
    cell.y < level.height
  );
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function parseCellKey(key: string): Cell {
  const [x, y] = key.split(",").map(Number);
  return { x: x!, y: y! };
}
