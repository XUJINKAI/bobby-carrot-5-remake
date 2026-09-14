import { MapEntityTypeId } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";

/** 原版 Bean 生长区内的具体语义地形，见 docs/reference/original-passage.md 第 4 节。 */
const BEAN_GROWTH_TERRAIN = new Set<string>([
  MapEntityTypeId.STUMP,
  MapEntityTypeId.SNOWY_ROCK,
  MapEntityTypeId.FLOWER_POT,
  MapEntityTypeId.STONE_WALL,
  MapEntityTypeId.CHRISTMAS_TREE,
  MapEntityTypeId.TREE,
  MapEntityTypeId.SNOW_FENCE,
  MapEntityTypeId.CANDY_CANE,
  MapEntityTypeId.SNOWMAN,
  MapEntityTypeId.HEDGE,
  MapEntityTypeId.ROCK,
  MapEntityTypeId.MUSHROOM,
  MapEntityTypeId.CACTUS,
  MapEntityTypeId.STARFIELD,
  MapEntityTypeId.MOON,
  MapEntityTypeId.WATER,
  MapEntityTypeId.TIDE,
  MapEntityTypeId.WATERFALL,
  MapEntityTypeId.SNOW,
]);

const OTHER_TERRAIN = new Set<string>([
  MapEntityTypeId.GRASS,
  MapEntityTypeId.SNOW_CLOUD,
  MapEntityTypeId.SAND,
  MapEntityTypeId.TRANSPARENT,
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
  MapEntityTypeId.ICE,
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
  MapEntityTypeId.MOWER_PARKING,
  MapEntityTypeId.PUSH_GOAL,
  MapEntityTypeId.LANDING,
  RuntimeEntityTypeId.SHOVEL_CLEARED_GROUND,
]);

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

function isOriginalTerrainType(type: string): boolean {
  return BEAN_GROWTH_TERRAIN.has(type) || OTHER_TERRAIN.has(type);
}

/** Adapter 展开的 Snow + 基础地面仍代表一个 terrain；动态载体不占 object grid。 */
export function beanCanGrowAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): boolean {
  if (!query.inBounds(cell)) return false;
  const presences = query.presencesAt(cell);
  const types = presences.map((presence) => query.entity(presence.entityId)?.type);
  return types.some((type) => type && BEAN_GROWTH_TERRAIN.has(type)) &&
    types.every((type) => type !== undefined && (
      isOriginalTerrainType(type) ||
      type === MapEntityTypeId.CLOUD ||
      type === MapEntityTypeId.LEAF
    ));
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
  return presences.some((presence) => {
    const type = query.entity(presence.entityId)?.type;
    return type !== undefined && FIREBALL_TERRAIN.has(type);
  });
}
