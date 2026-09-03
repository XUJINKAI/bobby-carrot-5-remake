import type { EntityCatalog } from "@bobby/engine";
import {
  EntityTypeId,
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

const terrainById = new Map(
  SURFACE_TERRAINS.map((definition) => [definition.id, definition] as const),
);
const terrainByEntityType = new Map<EntityType, SurfaceTerrainDefinition>();
for (const terrain of SURFACE_TERRAINS)
  for (const variant of terrain.rows.flat())
    terrainByEntityType.set(variant.type, terrain);

// Fence 的 Auto 形态由 canonical Entity 根据邻居实时解析；Exact 仍使用原始图块。
const fenceTerrain = terrainById.get("fence");
if (fenceTerrain) terrainByEntityType.set(EntityTypeId.FENCE, fenceTerrain);

const surfaceTypes = new Set<EntityType>(terrainByEntityType.keys());
for (const type of LEGACY_GROUND_TYPES) surfaceTypes.add(type);

export function isSurfaceEntityType(type: EntityType): boolean {
  return surfaceTypes.has(type);
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
        const type = resolveAutoType(target, entity, 1, new Set());
        catalog.require(type);
        if (type === entity.type) return entity;
        changed = true;
        return applySurfaceInstanceTraits({ ...entity, type }, target);
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
      const slot = surfaceTerrain(brush.terrain).slot;
      const kept = level.entities.filter((entity) => {
        if (!target.has(cellKey(entity))) return true;
        return surfaceTerrainForEntity(entity.type)?.slot !== slot;
      });
      const painted = [...target]
        .map((key) =>
          createSurfaceEntity(catalog, brush, parseCellKey(key), target),
        )
        .filter((entity): entity is LevelEntity => entity !== null);
      return normalizeEditorLevel({
        ...level,
        entities: [...kept, ...painted],
      });
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
  return {
    terrain: item.id,
    pattern: "exact",
    exact: entity.type,
    seed: 1,
  };
}

function createSurfaceEntity(
  catalog: EntityCatalog,
  brush: SurfaceBrush,
  cell: Cell,
  target: ReadonlySet<string>,
): LevelEntity | null {
  const item = surfaceTerrain(brush.terrain);
  const variants = item.rows.flat();
  if (variants.length === 0) return null;

  let type: EntityType;
  if (
    brush.pattern === "exact" &&
    brush.exact &&
    variants.some((variant) => variant.type === brush.exact)
  ) {
    type = brush.exact;
  } else if (
    brush.pattern === "alternate" &&
    brush.alternate &&
    brush.alternate.every((candidate) =>
      variants.some((variant) => variant.type === candidate),
    )
  ) {
    type = brush.alternate[(cell.x + cell.y) & 1]!;
  } else {
    type = resolveAutoType(item, cell, brush.seed, target);
  }

  catalog.require(type);
  return applySurfaceInstanceTraits({ type, x: cell.x, y: cell.y }, item);
}

function resolveAutoType(
  terrain: SurfaceTerrainDefinition,
  cell: Cell,
  seed: number,
  target: ReadonlySet<string>,
): EntityType {
  if (terrain.id === "fence") return EntityTypeId.FENCE;
  const auto = terrain.auto;
  if (auto.kind === "primary") return terrain.primary;
  if (auto.kind === "vertical") {
    const above = target.has(cellKey({ x: cell.x, y: cell.y - 1 }));
    const below = target.has(cellKey({ x: cell.x, y: cell.y + 1 }));
    return !above ? auto.start : !below ? auto.end : auto.middle;
  }
  return weightedAutoVariant(auto, hashCell(cell, seed + (auto.salt ?? 0)));
}

function applySurfaceInstanceTraits(
  entity: LevelEntity,
  terrain: SurfaceTerrainDefinition,
): LevelEntity {
  if (terrain.slot !== "overlay" || terrain.type !== "solid") return entity;
  return {
    ...entity,
    traits: ["blocking", "fence"],
  };
}

function weightedAutoVariant(
  auto: Extract<SurfaceAutoDefinition, { kind: "weighted" }>,
  hash: number,
): EntityType {
  const entries = auto.variants.filter((variant) => variant.weight > 0);
  if (entries.length === 0)
    throw new Error("Surface weighted Auto 至少需要一个正权重 variant");
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  let target = hash % total;
  for (const item of entries) {
    target -= item.weight;
    if (target < 0) return item.type;
  }
  return entries[0]!.type;
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
