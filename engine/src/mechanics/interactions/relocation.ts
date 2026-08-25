import type { LevelMap, ObjectType } from "../../data/types.js";
import type { Point, RuntimeState } from "../../world/RuntimeState.js";

export function relocateToMatchingObject(
  state: RuntimeState,
  level: LevelMap,
  source: Point,
  type: ObjectType,
  propertyKey: string,
): Point | null {
  const value = state.objectProperties[source.y]?.[source.x]?.[propertyKey];
  if (!value) return null;
  for (let y = 0; y < level.height; y++)
    for (let x = 0; x < level.width; x++)
      if (
        (x !== source.x || y !== source.y) &&
        state.objects[y]?.[x] === type &&
        state.objectProperties[y]?.[x]?.[propertyKey] === value
      ) {
        state.player = { x, y };
        return { x, y };
      }
  return null;
}
