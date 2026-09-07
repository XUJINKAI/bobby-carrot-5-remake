import {
  EntityTypeId,
  MapEntityTypeId,
  coordinateSurfaceType,
  legacyEntityMapAlias,
  surfaceMappingForTs,
  type EntityType,
  type LevelEntity,
  type SurfaceSourceMapping,
} from "@bobby/model";
import type { EditorMap } from "../level/types.js";
import {
  materializeSurfaceVariants as resolveAutoSurfaceVariants,
  surfaceTerrainForEntity,
  type SurfaceBrush,
  type SurfaceSlot,
  type SurfaceTerrainDefinition,
  type SurfaceTerrainId,
} from "./surfaceAuthoring.js";
import type { Cell } from "./entityPlacement.js";

const AUTO_TERRAIN_KEY = "__editorSurfaceAuto";
const AUTO_SEED_KEY = "__editorSurfaceSeed";

/**
 * Editor 内 Auto Surface 可以保持未锁定 variant；写出地图前统一固定当前 visual。
 * raw ts.png Surface 规范化为该 terrain 的 primary type + 1-based absolute ts variant。
 */
export function materializeSurfaceVariants(level: EditorMap): EditorMap {
  const resolved = resolveAutoSurfaceVariants(level);
  return {
    ...resolved,
    entities: resolved.entities.map(canonicalizeSurfaceVariant),
  };
}

/** 吸取已保存的 canonical type + flat variant 时仍恢复到对应 Exact visual。 */
export function pickSurfaceBrush(
  level: Readonly<EditorMap>,
  cell: Cell,
): SurfaceBrush | null {
  const entity =
    surfaceAt(level, cell, "overlay") ?? surfaceAt(level, cell, "base");
  if (!entity) return null;
  const terrain = surfaceTerrainForEntity(entity.type);
  if (!terrain) return null;

  const autoTerrain = entity[AUTO_TERRAIN_KEY];
  if (typeof autoTerrain === "string") {
    const seed = Number(entity[AUTO_SEED_KEY]);
    return {
      terrain: autoTerrain as SurfaceTerrainId,
      pattern: "auto",
      seed: Number.isFinite(seed) ? seed : 1,
    };
  }

  const exact = resolveFixedVariantType(entity, terrain);
  return {
    terrain: terrain.id,
    pattern: "exact",
    exact: exact ?? terrain.rows.flat()[0]?.type ?? terrain.primary,
    seed: 1,
  };
}

function canonicalizeSurfaceVariant(entity: LevelEntity): LevelEntity {
  if (entity.type === EntityTypeId.FENCE) {
    const index = Number(entity.variant);
    if (Number.isInteger(index) && index >= 1 && index <= 6)
      return mappedSurfaceEntity(entity, surfaceMappingForTs(16, 9 + index));
  }

  if (entity.type === EntityTypeId.WATER_ANIMATED)
    return { ...stripAutoMetadata(entity), type: MapEntityTypeId.WATER_RIPPLE };

  const alias = legacyEntityMapAlias(entity.type);
  if (alias?.to) {
    return {
      ...stripAutoMetadata(entity),
      type: alias.to,
      ...(alias.fields ?? {}),
    };
  }

  const absolute = absoluteTsVariant(entity);
  if (absolute === null) return stripAutoMetadata(entity);
  const row = Math.floor((absolute - 1) / 16) + 1;
  const column = ((absolute - 1) % 16) + 1;
  return mappedSurfaceEntity(
    entity,
    surfaceMappingForTs(row, column),
    row,
    column,
  );
}

function mappedSurfaceEntity(
  entity: Readonly<LevelEntity>,
  mapping: SurfaceSourceMapping | undefined,
  row = 1,
  column = 1,
): LevelEntity {
  const next: LevelEntity = {
    ...stripAutoMetadata(entity),
    type: mapping?.type ?? coordinateSurfaceType(row, column),
  };
  delete next.variant;
  if (mapping?.fields) Object.assign(next, mapping.fields);
  return next;
}

function resolveFixedVariantType(
  entity: Readonly<LevelEntity>,
  terrain: SurfaceTerrainDefinition,
): EntityType | null {
  const variants = terrain.rows.flat();
  for (const candidate of variants) {
    if (candidate.type === entity.type) return candidate.type;
    const absolute = absoluteTsType(candidate.type);
    if (absolute === null) continue;
    const row = Math.floor((absolute - 1) / 16) + 1;
    const column = ((absolute - 1) % 16) + 1;
    const mapping = surfaceMappingForTs(row, column);
    if (!mapping || mapping.type !== entity.type) continue;
    const fields = mapping.fields ?? {};
    if (
      Object.entries(fields).every(([key, value]) => entity[key] === value)
    )
      return candidate.type;
  }
  return null;
}

function absoluteTsVariant(entity: Readonly<LevelEntity>): number | null {
  const fixed = Number(entity.variant);
  if (Number.isInteger(fixed) && fixed >= 1 && fixed <= 256) return fixed;
  return absoluteTsType(entity.type);
}

function absoluteTsType(type: EntityType): number | null {
  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) return Number(background[1]);
  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) return 96 + Number(walkable[1]);
  return null;
}

function stripAutoMetadata(entity: Readonly<LevelEntity>): LevelEntity {
  const next = { ...structuredClone(entity) };
  delete next[AUTO_TERRAIN_KEY];
  delete next[AUTO_SEED_KEY];
  return next;
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
