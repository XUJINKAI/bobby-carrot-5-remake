import type { LevelMap, ObjectType } from "../data/types.js";
import { CustomObjectId } from "../mechanics/ids.js";
import type { Point, RuntimeState } from "../world/RuntimeState.js";
import type { WorldEvent } from "../world/WorldTypes.js";

export function teleportFromPortal(
  state: RuntimeState,
  level: LevelMap,
  point: Point,
  events: WorldEvent[],
): void {
  const channel = state.objectProperties[point.y]?.[point.x]?.channel;
  if (!channel) return;
  for (let y = 0; y < level.height; y++)
    for (let x = 0; x < level.width; x++)
      if (
        (x !== point.x || y !== point.y) &&
        state.objects[y]?.[x] === CustomObjectId.PORTAL &&
        state.objectProperties[y]?.[x]?.channel === channel
      ) {
        state.player = { x, y };
        events.push({
          type: "object-interaction",
          objectType: CustomObjectId.PORTAL,
          action: "teleport",
          message: `通过 ${channel} Portal`,
          x,
          y,
        });
        return;
      }
}

export function maxMovesDeathReason(
  state: RuntimeState,
  level: LevelMap,
  forced: boolean,
): string | null {
  const maxMoves = level.rules?.maxMoves;
  return !forced &&
    Number.isInteger(maxMoves) &&
    maxMoves !== undefined &&
    maxMoves > 0 &&
    state.moves > maxMoves
    ? `超过最大步数 ${maxMoves}`
    : null;
}
