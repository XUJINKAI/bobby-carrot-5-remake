import type { ObjectType, TerrainType } from "../../data/types.js";
import { ObjectId, Terrain, type Direction, type StepVector } from "../ids.js";
import type { RuntimeState } from "../../world/RuntimeState.js";
import {
  getObjectDefinition,
  getTerrainDefinition,
  nextTerrainAfterLeave,
  objectHasTrait,
  terrainHasTrait,
} from "../definitions.js";
import type {
  BehaviorContext,
  BehaviorPassageResult,
  TileBehavior,
} from "../behaviors.js";

export interface PassageResult extends BehaviorPassageResult {}

export function rotateCarousel(id: TerrainType): TerrainType {
  return terrainHasTrait(id, "carousel") ? nextTerrainAfterLeave(id) : id;
}

export function rotateMirror(id: TerrainType): TerrainType {
  return terrainHasTrait(id, "mirror") ? nextTerrainAfterLeave(id) : id;
}

export function toggleSpeedTerrain(id: TerrainType): TerrainType {
  switch (id) {
    case Terrain.SPEED_UP:
      return Terrain.SPEED_DOWN;
    case Terrain.SPEED_DOWN:
      return Terrain.SPEED_UP;
    case Terrain.SPEED_LEFT:
      return Terrain.SPEED_RIGHT;
    case Terrain.SPEED_RIGHT:
      return Terrain.SPEED_LEFT;
    case Terrain.SPEED_SWITCH_PRESSED:
      return Terrain.SPEED_SWITCH_RAISED;
    case Terrain.SPEED_SWITCH_RAISED:
      return Terrain.SPEED_SWITCH_PRESSED;
    default:
      return id;
  }
}

export function toggleTideTerrain(id: TerrainType): TerrainType {
  switch (id) {
    case Terrain.TIDE_UP:
      return Terrain.TIDE_DOWN;
    case Terrain.TIDE_DOWN:
      return Terrain.TIDE_UP;
    case Terrain.TIDE_LEFT:
      return Terrain.TIDE_RIGHT;
    case Terrain.TIDE_RIGHT:
      return Terrain.TIDE_LEFT;
    case Terrain.TIDE_SWITCH_RAISED:
      return Terrain.TIDE_SWITCH_PRESSED;
    case Terrain.TIDE_SWITCH_PRESSED:
      return Terrain.TIDE_SWITCH_RAISED;
    default:
      return id;
  }
}

export function toggleColorTerrain(
  id: TerrainType,
  color: "yellow" | "pink",
): TerrainType {
  if (color === "yellow") {
    switch (id) {
      case Terrain.COLOR_YELLOW_SWITCH_RAISED:
        return Terrain.COLOR_YELLOW_SWITCH_PRESSED;
      case Terrain.COLOR_YELLOW_SWITCH_PRESSED:
        return Terrain.COLOR_YELLOW_SWITCH_RAISED;
      case Terrain.COLOR_YELLOW_BLOCK_RAISED:
        return Terrain.COLOR_YELLOW_BLOCK_LOWERED;
      case Terrain.COLOR_YELLOW_BLOCK_LOWERED:
        return Terrain.COLOR_YELLOW_BLOCK_RAISED;
      default:
        return id;
    }
  }
  switch (id) {
    case Terrain.COLOR_PINK_SWITCH_RAISED:
      return Terrain.COLOR_PINK_SWITCH_PRESSED;
    case Terrain.COLOR_PINK_SWITCH_PRESSED:
      return Terrain.COLOR_PINK_SWITCH_RAISED;
    case Terrain.COLOR_PINK_BLOCK_RAISED:
      return Terrain.COLOR_PINK_BLOCK_LOWERED;
    case Terrain.COLOR_PINK_BLOCK_LOWERED:
      return Terrain.COLOR_PINK_BLOCK_RAISED;
    default:
      return id;
  }
}

export function isCarousel(id: TerrainType): boolean {
  return terrainHasTrait(id, "carousel");
}
export function isMirror(id: TerrainType): boolean {
  return terrainHasTrait(id, "mirror");
}
export function isWaterTerrain(id: TerrainType): boolean {
  return terrainHasTrait(id, "water");
}
export function isOrdinaryWalkableTerrain(id: TerrainType): boolean {
  return terrainHasTrait(id, "walkable");
}
export function isFence(id: ObjectType): boolean {
  return (
    id === ObjectId.FENCE_1 ||
    id === ObjectId.FENCE_2 ||
    id === ObjectId.FENCE_3 ||
    id === ObjectId.FENCE_4 ||
    id === ObjectId.FENCE_5 ||
    id === ObjectId.FENCE_6
  );
}

function directionAllowed(
  id: TerrainType,
  hook: "canEnter" | "canLeave",
  direction: Direction,
): boolean {
  const definition = getTerrainDefinition(id);
  if (!definition) return true;
  const context = { direction } as BehaviorContext;
  for (const behavior of definition.behaviors) {
    const decision = behavior[hook]?.(context);
    if (decision?.passable === false) return false;
  }
  return true;
}

export function canLeaveCarousel(id: TerrainType, vector: StepVector): boolean {
  const direction =
    vector.dx < 0
      ? "left"
      : vector.dx > 0
        ? "right"
        : vector.dy < 0
          ? "up"
          : "down";
  return directionAllowed(id, "canLeave", direction);
}

export function canEnterCarousel(id: TerrainType, vector: StepVector): boolean {
  const direction =
    vector.dx < 0
      ? "left"
      : vector.dx > 0
        ? "right"
        : vector.dy < 0
          ? "up"
          : "down";
  return directionAllowed(id, "canEnter", direction);
}

export function objectOverridesTerrainPassage(id: ObjectType): boolean {
  return objectHasTrait(id, "terrain-overlay");
}

export function objectBlocksByDefault(id: ObjectType): boolean {
  return objectHasTrait(id, "blocking");
}

function runHook(
  behaviors: readonly TileBehavior[],
  hook: "canEnter" | "canLeave" | "passage",
  ctx: BehaviorContext,
): PassageResult | undefined {
  for (const behavior of behaviors) {
    const decision = behavior[hook]?.(ctx);
    if (decision !== undefined) return decision;
  }
  return undefined;
}

export function passageFor(
  state: RuntimeState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  direction: Direction,
  terrainId: TerrainType,
  objectId: ObjectType,
): PassageResult {
  const fromTerrain = state.terrain[fromY]?.[fromX];
  const terrainDefinition = getTerrainDefinition(terrainId);
  const objectDefinition = getObjectDefinition(objectId);
  const ctx: BehaviorContext = {
    state,
    direction,
    terrainId,
    objectId,
    ...(fromTerrain !== undefined ? { fromTerrain } : {}),
  };

  if (
    state.ridingMower &&
    (isCarousel(terrainId) ||
      (fromTerrain !== undefined && isCarousel(fromTerrain)))
  ) {
    return {
      passable: false,
      reason: "割草机不能进入旋转通道",
      confidence: "confirmed",
    };
  }

  if (fromTerrain !== undefined) {
    const fromDefinition = getTerrainDefinition(fromTerrain);
    const leaveDecision = fromDefinition
      ? runHook(fromDefinition.behaviors, "canLeave", ctx)
      : undefined;
    if (leaveDecision?.passable === false) return leaveDecision;
  }

  const enterDecision = terrainDefinition
    ? runHook(terrainDefinition.behaviors, "canEnter", ctx)
    : undefined;
  if (enterDecision?.passable === false) return enterDecision;

  const terrainDecision = terrainDefinition
    ? runHook(terrainDefinition.behaviors, "passage", ctx)
    : undefined;
  if (terrainDecision !== undefined) return terrainDecision;

  const overlayPassable = objectOverridesTerrainPassage(objectId);
  if (isWaterTerrain(terrainId) && !overlayPassable) {
    return {
      passable: false,
      reason: "水面需要荷叶或桥面等覆盖对象",
      confidence: "confirmed",
    };
  }
  if (!isOrdinaryWalkableTerrain(terrainId) && !overlayPassable) {
    return {
      passable: false,
      reason: `地形 ${terrainId} 不可直接通行`,
      confidence: "inferred",
    };
  }

  const objectDecision = objectDefinition
    ? runHook(objectDefinition.behaviors, "passage", ctx)
    : undefined;
  if (objectDecision !== undefined) return objectDecision;

  if (objectBlocksByDefault(objectId)) {
    return {
      passable: false,
      reason: `对象 ${objectId} 阻挡道路`,
      confidence: "confirmed",
    };
  }

  return {
    passable: true,
    reason: overlayPassable ? "覆盖对象提供通路" : "可通行",
    confidence: "confirmed",
  };
}
