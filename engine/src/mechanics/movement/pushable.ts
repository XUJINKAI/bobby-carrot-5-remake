import type { LevelMap } from "../../data/types.js";
import { EMPTY_OBJECT } from "../ids.js";
import { terrainHasTrait } from "../definitions.js";
import type { Point, RuntimeState } from "../../world/RuntimeState.js";
import { effectiveObjectHasTrait } from "../traits/effective.js";

export function canPushObject(
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
  return true;
}

export function commitPushObject(state: RuntimeState, level: LevelMap, from: Point, to: Point): void {
  const type = state.objects[from.y]![from.x]!;
  const properties = state.objectProperties[from.y]![from.x];
  const traits = state.objectTraits[from.y]![from.x];
  state.objects[to.y]![to.x] = type;
  state.objectProperties[to.y]![to.x] = properties
    ? { ...properties }
    : undefined;
  state.objectTraits[to.y]![to.x] = traits ? [...traits] : undefined;
  state.objects[from.y]![from.x] = EMPTY_OBJECT;
  state.objectProperties[from.y]![from.x] = undefined;
  state.objectTraits[from.y]![from.x] = undefined;
  refreshRockGoals(state, level);
}

function refreshRockGoals(state: RuntimeState, level: LevelMap): void {
  let total = 0;
  let filled = 0;
  for (let y = 0; y < level.height; y++)
    for (let x = 0; x < level.width; x++)
      if (terrainHasTrait(state.terrain[y]![x]!, "push-goal")) {
        total++;
        if (
          effectiveObjectHasTrait(
            state.objects[y]![x]!,
            state.objectTraits[y]?.[x],
            "pushable",
          )
        )
          filled++;
      }
  if (total > 0) {
    state.pushGoalsRemaining = total - filled;
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
