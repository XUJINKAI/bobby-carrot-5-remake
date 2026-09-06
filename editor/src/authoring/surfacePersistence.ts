import { EntityTypeId, type EntityType, type LevelEntity } from "@bobby/model";
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
  const terrain = surfaceTerrainForEntity(entity.type);
  if (!terrain) return entity;

  if (terrain.id === "wood-fence" && entity.type === EntityTypeId.FENCE)
    return entity;

  if (terrain.id === "water") {
    const variant =
      entity.type === EntityTypeId.WATER_ANIMATED
        ? 2
        : entity.type === EntityTypeId.WATER
          ? 1
          : Number(entity.variant);
    return Number.isInteger(variant)
      ? withVariant(entity, entity.type, variant)
      : entity;
  }

  const absolute = absoluteTsVariant(entity);
  const primaryAbsolute = absoluteTsType(terrain.primary);
  if (absolute === null || primaryAbsolute === null) return entity;
  return withVariant(entity, terrain.primary, absolute);
}

function resolveFixedVariantType(
  entity: Readonly<LevelEntity>,
  terrain: SurfaceTerrainDefinition,
): EntityType | null {
  const variants = terrain.rows.flat();
  if (terrain.id === "wood-fence" && entity.type === EntityTypeId.FENCE) {
    const index = Number(entity.variant) - 1;
    return Number.isInteger(index) && index >= 0
      ? variants[index]?.type ?? null
      : null;
  }
  if (terrain.id === "water") {
    const index = Number(entity.variant) - 1;
    if (Number.isInteger(index) && index >= 0)
      return variants[index]?.type ?? null;
    return variants.find((candidate) => candidate.type === entity.type)?.type ?? null;
  }

  const absolute = absoluteTsVariant(entity);
  if (absolute === null) return entity.type;
  return (
    variants.find((candidate) => absoluteTsType(candidate.type) === absolute)?.type ??
    entity.type
  );
}

function withVariant(
  entity: Readonly<LevelEntity>,
  type: EntityType,
  variant: number,
): LevelEntity {
  return { ...entity, type, variant };
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
