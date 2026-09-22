import { MapEntityTypeId, type Direction } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import { RuntimeEntityTypeId } from "../../entities/runtime-types.js";

export type EnergyPropagationResult =
  | { readonly kind: "blocked" }
  | { readonly kind: "straight" }
  | { readonly kind: "reflected"; readonly direction: Direction };

/**
 * 原版 Fireball Q() 的地形范围。
 *
 * 这份集合是 Energy 传播的兼容性基线，依据见
 * docs/reference/original-passage.md 第 7 节。
 */
const ENERGY_TERRAIN = new Set<string>([
  MapEntityTypeId.STARFIELD,
  MapEntityTypeId.MOON,
  MapEntityTypeId.WATER,
  MapEntityTypeId.TIDE,
  MapEntityTypeId.WATERFALL,
  MapEntityTypeId.GRASS,
  MapEntityTypeId.SNOW_CLOUD,
  MapEntityTypeId.SAND,
  MapEntityTypeId.ICE,
  MapEntityTypeId.START,
  MapEntityTypeId.EXIT,
  MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
  MapEntityTypeId.SHOP_CLOUD9_TICKET,
  MapEntityTypeId.LOCK_KEY,
  MapEntityTypeId.SHOP_STEREO_SYSTEM,
  MapEntityTypeId.SHOP_EXTRA_MUSIC,
  MapEntityTypeId.SHOP_SPEED_SHOES,
  MapEntityTypeId.SHOP_COIN_RADAR,
  MapEntityTypeId.SHOP_EMPTY,
  MapEntityTypeId.SHOVEL_PICKUP,
  MapEntityTypeId.MOWER_PARKING,
  MapEntityTypeId.TIDE_SWITCH,
  MapEntityTypeId.SPEED_SWITCH,
  MapEntityTypeId.CAROUSEL_SWITCH,
  MapEntityTypeId.WIND_SWITCH,
  MapEntityTypeId.TRAP,
  MapEntityTypeId.MIRROR,
  MapEntityTypeId.SPEED,
  MapEntityTypeId.CAROUSEL,
  MapEntityTypeId.COLOR_SWITCH,
  MapEntityTypeId.COLOR_BLOCK,
  MapEntityTypeId.HIGH_GRASS,
  RuntimeEntityTypeId.SHOVEL_CLEARED_GROUND,
]);

/**
 * 解析 Energy 进入一个格子的结果。
 *
 * 顺序严格对应原版 Fireball：边界、地形、对象、镜面。调用方在成功进入后
 * 再处理融冰、伤害或引爆等具体 Energy 的命中效果。
 */
export function resolveEnergyPropagationAt(
  query: Pick<WorldQueryApi, "inBounds" | "presencesAt" | "entity">,
  cell: { readonly x: number; readonly y: number },
  incoming: Direction,
): EnergyPropagationResult {
  if (!query.inBounds(cell) || !energyTerrainAllowsEntry(query, cell)) {
    return { kind: "blocked" };
  }
  if (energyObjectBlocksEntry(query, cell)) return { kind: "blocked" };

  const reflected = originalMirrorReflectionAt(query, cell, incoming);
  if (reflected === false) return { kind: "blocked" };
  if (reflected !== null) {
    return { kind: "reflected", direction: reflected };
  }
  return { kind: "straight" };
}

function energyTerrainAllowsEntry(
  query: Pick<WorldQueryApi, "presencesAt" | "entity">,
  cell: { readonly x: number; readonly y: number },
): boolean {
  const presences = query.presencesAt(cell);
  if (presences.some((presence) =>
    query.entity(presence.entityId)?.type === MapEntityTypeId.SNOW
  )) {
    return false;
  }
  // Ice Block 是 Fireball 接触后立即融化的目标，本身即可许可这一格移动。
  if (presences.some((presence) =>
    query.entity(presence.entityId)?.type === MapEntityTypeId.ICE_BLOCK
  )) {
    return true;
  }
  return presences.some((presence) => {
    const type = query.entity(presence.entityId)?.type;
    return type !== undefined && ENERGY_TERRAIN.has(type);
  });
}

function energyObjectBlocksEntry(
  query: Pick<WorldQueryApi, "presencesAt" | "entity">,
  cell: { readonly x: number; readonly y: number },
): boolean {
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    if (entity?.type === MapEntityTypeId.CRUMBLY_ROCK) return true;
    if (entity?.type === MapEntityTypeId.DRAGON && presence.role !== "tail") {
      return true;
    }
    if (entity?.type !== MapEntityTypeId.COLOR_BLOCK) return false;
    return entity.state?.raised !== false;
  });
}

function originalMirrorReflectionAt(
  query: Pick<WorldQueryApi, "presencesAt" | "entity">,
  cell: { readonly x: number; readonly y: number },
  incoming: Direction,
): Direction | null | false {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== MapEntityTypeId.MIRROR) continue;
    const reflection: Partial<Record<Direction, Direction>> =
      entity.state?.variant === "left-bottom"
        ? { right: "down", up: "left" }
        : entity.state?.variant === "right-top"
          ? { left: "up", down: "right" }
          : entity.state?.variant === "left-top"
            ? { right: "up", down: "left" }
            : { left: "down", up: "right" };
    return reflection[incoming] ?? false;
  }
  return null;
}
