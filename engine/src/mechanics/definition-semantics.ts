import type { ObjectType, TerrainType } from "../data/types.js";
import { ObjectId, Terrain } from "./ids.js";
import type { TileTrait } from "./definition-types.js";

export const HIDDEN_AUTHORING_OBJECTS = new Set<ObjectType>([
  ObjectId.CONSUMED_CARROT,
  ObjectId.PLANK_CRUMBLING,
  ObjectId.PLANK_FRAGMENT,
  ObjectId.ICE_MELT_1,
  ObjectId.ICE_MELT_2,
  ObjectId.ICE_MELT_3,
  ObjectId.DRAGON_ANIM_1,
  ObjectId.DRAGON_ANIM_2,
  ObjectId.BEAN_SPROUT,
]);
export function pretty(id: string): string {
  return id
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}
const WATER_IDS = new Set<TerrainType>([
  Terrain.WATER,
  Terrain.WATER_ANIMATED,
  Terrain.TIDE_UP,
  Terrain.TIDE_DOWN,
  Terrain.TIDE_LEFT,
  Terrain.TIDE_RIGHT,
  Terrain.WATER_VARIANT_1,
  Terrain.WATER_VARIANT_2,
  Terrain.WATER_VARIANT_3,
]);
export const DYNAMIC_IDS = new Set<ObjectType>([
  ObjectId.CLOUD_RED,
  ObjectId.CLOUD_PURPLE,
  ObjectId.CLOUD_GREEN,
  ObjectId.LEAF,
]);
export function isWaterSemantic(id: TerrainType): boolean {
  return WATER_IDS.has(id);
}
export function isWalkableSemantic(id: TerrainType): boolean {
  if (id.startsWith("walkable-variant-")) return true;
  if (id.startsWith("background-variant-")) return false;
  if (isWaterSemantic(id) || id === Terrain.SNOW) return false;
  return true;
}
export function environmentTraits(id: TerrainType): TileTrait[] {
  const out: TileTrait[] = [];
  if (isWalkableSemantic(id)) out.push("walkable");
  if (isWaterSemantic(id)) out.push("water");
  if (
    isWalkableSemantic(id) ||
    isWaterSemantic(id) ||
    id.startsWith("background-variant-")
  )
    out.push("cloud-passable");
  if (
    (isWalkableSemantic(id) ||
      isWaterSemantic(id) ||
      id.startsWith("background-variant-")) &&
    id !== Terrain.COLOR_YELLOW_BLOCK_RAISED &&
    id !== Terrain.COLOR_PINK_BLOCK_RAISED
  )
    out.push("dragon-fire-passable");
  if (isWaterSemantic(id) || id.startsWith("background-variant-"))
    out.push("beanstalk-growth");
  return out;
}
