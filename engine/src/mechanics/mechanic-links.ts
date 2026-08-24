import type { ObjectType, TerrainType } from "../data/types.js";
import { ObjectId, Terrain, type Direction } from "./ids.js";

export const CLOUD_INFO: Array<[ObjectType, ObjectType]> = [
  [ObjectId.CLOUD_RED, ObjectId.CLOUD_GRID_RED],
  [ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GRID_PURPLE],
  [ObjectId.CLOUD_GREEN, ObjectId.CLOUD_GRID_GREEN],
];

const TIDE_DIRECTION = new Map<TerrainType, Direction>([
  [Terrain.TIDE_UP, "up"],
  [Terrain.TIDE_DOWN, "down"],
  [Terrain.TIDE_LEFT, "left"],
  [Terrain.TIDE_RIGHT, "right"],
]);
const WINDMILL_INFO = new Map<
  ObjectType,
  { index: number; direction: Direction }
>([
  [ObjectId.WINDMILL_UP, { index: 0, direction: "up" }],
  [ObjectId.WINDMILL_DOWN, { index: 1, direction: "down" }],
  [ObjectId.WINDMILL_LEFT, { index: 2, direction: "left" }],
  [ObjectId.WINDMILL_RIGHT, { index: 3, direction: "right" }],
]);
const WIND_SWITCH_INDEX = new Map<TerrainType, number>([
  [Terrain.WIND_SWITCH_0_ON, 0],
  [Terrain.WIND_SWITCH_0_OFF, 0],
  [Terrain.WIND_SWITCH_1_ON, 1],
  [Terrain.WIND_SWITCH_1_OFF, 1],
  [Terrain.WIND_SWITCH_2_ON, 2],
  [Terrain.WIND_SWITCH_2_OFF, 2],
  [Terrain.WIND_SWITCH_3_ON, 3],
  [Terrain.WIND_SWITCH_3_OFF, 3],
]);
const WIND_SWITCH_PEER = new Map<TerrainType, TerrainType>([
  [Terrain.WIND_SWITCH_0_ON, Terrain.WIND_SWITCH_0_OFF],
  [Terrain.WIND_SWITCH_0_OFF, Terrain.WIND_SWITCH_0_ON],
  [Terrain.WIND_SWITCH_1_ON, Terrain.WIND_SWITCH_1_OFF],
  [Terrain.WIND_SWITCH_1_OFF, Terrain.WIND_SWITCH_1_ON],
  [Terrain.WIND_SWITCH_2_ON, Terrain.WIND_SWITCH_2_OFF],
  [Terrain.WIND_SWITCH_2_OFF, Terrain.WIND_SWITCH_2_ON],
  [Terrain.WIND_SWITCH_3_ON, Terrain.WIND_SWITCH_3_OFF],
  [Terrain.WIND_SWITCH_3_OFF, Terrain.WIND_SWITCH_3_ON],
]);
const CLOUD_GRID = new Map<ObjectType, ObjectType>(CLOUD_INFO);
export function tideDirectionForTerrain(
  id: TerrainType,
): Direction | undefined {
  return TIDE_DIRECTION.get(id);
}
export function windmillInfoForObject(
  id: ObjectType,
): { index: number; direction: Direction } | undefined {
  return WINDMILL_INFO.get(id);
}
export function windSwitchIndexForTerrain(id: TerrainType): number | undefined {
  return WIND_SWITCH_INDEX.get(id);
}
export function windSwitchPeerForTerrain(
  id: TerrainType,
): TerrainType | undefined {
  return WIND_SWITCH_PEER.get(id);
}
export function cloudGridForObject(id: ObjectType): ObjectType | undefined {
  return CLOUD_GRID.get(id);
}
