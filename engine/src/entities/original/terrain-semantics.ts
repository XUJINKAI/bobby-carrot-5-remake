import { MapEntityTypeId } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";

/** 原版 Fireball Q() 的地形范围，见 docs/reference/original-passage.md 第 7 节。 */
const FIREBALL_TERRAIN = new Set<string>([
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

/** 地面提供生长基底；垂直占用由各对象 Definition 自己声明。 */
export function beanCanGrowAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): boolean {
  if (!query.inBounds(cell)) return false;
  const presences = query.allPresencesAt(cell);
  return presences.some((presence) =>
    presence.facts.includes("growth-substrate")
  ) && !presences.some((presence) =>
    presence.facts.includes("vertical-occupant")
  );
}

/** Fireball 只读取原版地形域；覆盖 Snow 时，下层地面不提供传播许可。 */
export function fireballCanTraverseTerrainAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): boolean {
  const presences = query.presencesAt(cell);
  if (presences.some((presence) =>
    query.entity(presence.entityId)?.type === MapEntityTypeId.SNOW
  ))
    return false;
  // Ice Block 是火球接触后立即融化的目标，本身即可许可这一格移动。
  if (presences.some((presence) =>
    query.entity(presence.entityId)?.type === MapEntityTypeId.ICE_BLOCK
  ))
    return true;
  return presences.some((presence) => {
    const type = query.entity(presence.entityId)?.type;
    return type !== undefined && FIREBALL_TERRAIN.has(type);
  });
}
