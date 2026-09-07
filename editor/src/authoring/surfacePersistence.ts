import {
  type EntityType,
  type JsonPrimitive,
  type LevelEntity,
} from "@bobby/model";
import type { EditorPlacementPreset } from "../definitions/types.js";
import type { EditorMap } from "../level/types.js";
import {
  materializeSurfaceVariants as resolveAutoSurfaceVariants,
  surfaceEntityForVisual,
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
 * atlas 坐标选择值会规范化为该格对应的语义 Entity。
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

/** Inspector 使用与 Surface Palette 相同的 visual variant 身份。 */
export function surfaceVisualVariant(
  entity: Readonly<LevelEntity>,
): EntityType | null {
  const terrain = surfaceTerrainForEntity(entity.type);
  if (!terrain) return null;
  if (
    terrain.auto.kind === "fence" &&
    terrain.auto.canonical === entity.type
  ) {
    return typeof entity.variant === "string" &&
      terrain.auto.variants.includes(entity.variant)
      ? entity.variant
      : null;
  }
  return resolveFixedVariantType(entity, terrain);
}

/** 把 Inspector 中选择的 atlas 单元写回 canonical Surface Entity。 */
export function replaceSurfaceVisualVariant(
  entity: Readonly<LevelEntity>,
  selectedType: EntityType,
): LevelEntity | null {
  const terrain = surfaceTerrainForEntity(entity.type);
  if (!terrain) return null;
  const variants = terrain.rows.flat();
  if (!variants.some((variant) => variant.type === selectedType)) return null;

  return {
    ...surfaceEntityForVisual(selectedType, entity),
    ...(entity.stackOrder !== undefined ? { stackOrder: entity.stackOrder } : {}),
  };
}

function canonicalizeSurfaceVariant(entity: LevelEntity): LevelEntity {
  const next = stripAutoMetadata(entity);
  if (!/^ts-\d+-\d+$/.test(next.type)) return next;
  return { ...next, ...surfaceEntityForVisual(next.type, next) };
}

function resolveFixedVariantType(
  entity: Readonly<LevelEntity>,
  terrain: SurfaceTerrainDefinition,
): EntityType | null {
  const variants = terrain.rows.flat();
  for (const candidate of variants) {
    if (candidate.type === entity.type) return candidate.type;
    const mapped = canonicalizeSurfaceVariant({
      type: candidate.type,
      x: entity.x,
      y: entity.y,
    });
    if (mapped.type !== entity.type) continue;
    const fields = Object.fromEntries(
      Object.entries(mapped).filter(
        ([key]) => key !== "type" && key !== "x" && key !== "y",
      ),
    );
    if (
      Object.entries(fields).every(([key, value]) => entity[key] === value)
    )
      return candidate.type;
  }
  return null;
}

/** Surface Palette 和 Inspector 预览使用与地图相同的语义 Entity。 */
export function surfaceVariantPreset(visual: EntityType): EditorPlacementPreset {
  const entity = surfaceEntityForVisual(visual);
  const fields: Record<string, JsonPrimitive> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (key === "type" || key === "x" || key === "y") continue;
    if (value === null || ["string", "number", "boolean"].includes(typeof value))
      fields[key] = value as JsonPrimitive;
  }
  return {
    type: entity.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
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
