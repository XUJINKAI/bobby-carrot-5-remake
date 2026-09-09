import type { Direction } from "@bobby/model";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { MoveIntent, WorldIntentGroup } from "../world/movement/WorldIntent.js";

export interface DirectionTransform {
  /** 顺时针旋转的 90 度次数；先旋转，再应用两个镜像轴。 */
  quarterTurns?: 0 | 1 | 2 | 3;
  mirrorX?: boolean;
  mirrorY?: boolean;
}

export interface ControlTarget {
  entityId: EntityId;
  directionTransform?: DirectionTransform;
}

export interface ControlBinding {
  /** Logical input channel, e.g. arrows, wasd, joystick-1, external. */
  input: string;
  targets: readonly ControlTarget[];
}

const ROTATE_CW_DIRECTION: Readonly<Record<Direction, Direction>> = {
  up: "right",
  right: "down",
  down: "left",
  left: "up",
};
export function transformDirection(
  direction: Direction,
  transform: DirectionTransform = {},
): Direction {
  let result = direction;
  const turns = transform.quarterTurns ?? 0;
  for (let turn = 0; turn < turns; turn += 1) {
    result = ROTATE_CW_DIRECTION[result];
  }
  if (transform.mirrorX) {
    if (result === "left") result = "right";
    else if (result === "right") result = "left";
  }
  if (transform.mirrorY) {
    if (result === "up") result = "down";
    else if (result === "down") result = "up";
  }
  return result;
}

export function resolveControlInput(
  bindings: readonly ControlBinding[],
  input: string,
  direction: Direction,
): WorldIntentGroup {
  const intents: MoveIntent[] = [];
  for (const binding of bindings) {
    if (binding.input !== input) continue;
    for (const target of binding.targets) {
      intents.push({
        type: "move",
        actorId: target.entityId,
        direction: transformDirection(direction, target.directionTransform),
        cause: { type: "player-input", source: input },
      });
    }
  }
  return { intents, historyBoundary: true };
}
