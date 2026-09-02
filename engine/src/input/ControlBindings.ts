import type { Direction } from "@bobby/model";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { MoveIntent, WorldIntentGroup } from "../world/movement/WorldIntent.js";

export type DirectionTransform =
  | "identity"
  | "mirror-x"
  | "mirror-y"
  | "reverse"
  | "rotate-cw"
  | "rotate-ccw";

export interface ControlTarget {
  entityId: EntityId;
  directionTransform?: DirectionTransform;
}

export interface ControlBinding {
  /** Logical input channel, e.g. arrows, wasd, joystick-1, external. */
  input: string;
  targets: readonly ControlTarget[];
}

export function transformDirection(
  direction: Direction,
  transform: DirectionTransform = "identity",
): Direction {
  if (transform === "identity") return direction;
  if (transform === "mirror-x") {
    if (direction === "left") return "right";
    if (direction === "right") return "left";
    return direction;
  }
  if (transform === "mirror-y") {
    if (direction === "up") return "down";
    if (direction === "down") return "up";
    return direction;
  }
  if (transform === "reverse") {
    return { up: "down", down: "up", left: "right", right: "left" }[direction];
  }
  if (transform === "rotate-cw") {
    return { up: "right", right: "down", down: "left", left: "up" }[direction];
  }
  return { up: "left", left: "down", down: "right", right: "up" }[direction];
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
