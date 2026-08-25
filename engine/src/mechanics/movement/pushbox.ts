import type { LevelMap } from "../../data/types.js";
import { CustomTerrain, EMPTY_OBJECT, ObjectId } from "../ids.js";
import { terrainHasTrait } from "../definitions.js";
import type { Point, RuntimeState } from "../../world/RuntimeState.js";

export function tryPushboxObject(
  state: RuntimeState,
  level: LevelMap,
  from: Point,
  to: Point,
): boolean {
  if (
    !inBounds(level, to) ||
    state.objects[to.y]?.[to.x] !== EMPTY_OBJECT ||
    state.dynamicEntities.some(
      (entity) => entity.x === to.x && entity.y === to.y,
    )
  )
    return false;
  const terrain = state.terrain[to.y]?.[to.x];
  if (!terrain || !terrainHasTrait(terrain, "walkable")) return false;
  const type = state.objects[from.y]![from.x]!;
  const properties = state.objectProperties[from.y]![from.x];
  state.objects[to.y]![to.x] = type;
  state.objectProperties[to.y]![to.x] = properties
    ? { ...properties }
    : undefined;
  state.objects[from.y]![from.x] = EMPTY_OBJECT;
  state.objectProperties[from.y]![from.x] = undefined;
  refreshRockGoals(state, level);
  return true;
}

function refreshRockGoals(state: RuntimeState, level: LevelMap): void {
  let total = 0;
  let filled = 0;
  for (let y = 0; y < level.height; y++)
    for (let x = 0; x < level.width; x++)
      if (state.terrain[y]?.[x] === CustomTerrain.PUSH_GOAL) {
        total++;
        if (state.objects[y]?.[x] === ObjectId.CRUMBLY_ROCK) filled++;
      }
  if (total > 0) {
    state.objectiveTotal = total;
    state.objectiveRemaining = total - filled;
  }
}

function inBounds(level: LevelMap, point: Point): boolean {
  return (
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < level.width &&
    point.y < level.height
  );
}
