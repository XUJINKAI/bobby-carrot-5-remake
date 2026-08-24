import {
  EMPTY_OBJECT,
  ObjectId,
  Terrain,
  type ObjectType,
  type TerrainType,
} from "@bobby/model";
export { EMPTY_OBJECT, ObjectId, Terrain } from "@bobby/model";
export type Direction = "left" | "right" | "up" | "down";
export interface StepVector {
  dx: number;
  dy: number;
}
export const DIRECTIONS: Record<Direction, StepVector> = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
};
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
};
export const SPEED_TERRAIN_DIRECTION = new Map<TerrainType, Direction>([
  [Terrain.SPEED_LEFT, "left"],
  [Terrain.SPEED_RIGHT, "right"],
  [Terrain.SPEED_UP, "up"],
  [Terrain.SPEED_DOWN, "down"],
]);
export const TIDE_TERRAIN_DIRECTION = new Map<TerrainType, Direction>([
  [Terrain.TIDE_UP, "up"],
  [Terrain.TIDE_DOWN, "down"],
  [Terrain.TIDE_LEFT, "left"],
  [Terrain.TIDE_RIGHT, "right"],
]);
export const WINDMILL_DIRECTION = new Map<ObjectType, Direction>([
  [ObjectId.WINDMILL_UP, "up"],
  [ObjectId.WINDMILL_DOWN, "down"],
  [ObjectId.WINDMILL_LEFT, "left"],
  [ObjectId.WINDMILL_RIGHT, "right"],
]);
export const DYNAMIC_OBJECT_IDS = new Set<ObjectType>([
  ObjectId.CLOUD_RED,
  ObjectId.CLOUD_PURPLE,
  ObjectId.CLOUD_GREEN,
  ObjectId.LEAF,
]);
export const CLOUD_OBJECT_IDS = new Set<ObjectType>([
  ObjectId.CLOUD_RED,
  ObjectId.CLOUD_PURPLE,
  ObjectId.CLOUD_GREEN,
]);
export const CLOUD_GRID_FOR_OBJECT = new Map<ObjectType, ObjectType>([
  [ObjectId.CLOUD_RED, ObjectId.CLOUD_GRID_RED],
  [ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GRID_PURPLE],
  [ObjectId.CLOUD_GREEN, ObjectId.CLOUD_GRID_GREEN],
]);
export function directionFromDelta(dx: number, dy: number): Direction | null {
  if (dx === -1 && dy === 0) return "left";
  if (dx === 1 && dy === 0) return "right";
  if (dx === 0 && dy === -1) return "up";
  if (dx === 0 && dy === 1) return "down";
  return null;
}
