import { MapEntityTypeId } from "@bobby/model";
import type { ActorPolicy } from "../../world/actor/ActorPolicy.js";
import {
  patchBobbyInventory,
  patchBobbyLocomotionMoveMs,
  readBobbyInventory,
  readBobbyLocomotionMoveMs,
} from "./BobbyState.js";

/** Bobby 专属状态解释留在对象层，World 只负责 intent 与命令的时序。 */
export const bobbyActorPolicy: ActorPolicy = {
  movementDurationMs: readBobbyLocomotionMoveMs,
  applyEffect(intent, actor, state, commands) {
    if (intent.type === "set-actor-locomotion") {
      if (!Number.isFinite(intent.moveDurationMs) || intent.moveDurationMs <= 0) {
        return undefined;
      }
      commands.emit({
        type: "actor-locomotion-changed",
        entityId: actor.id,
        data: { moveDurationMs: intent.moveDurationMs },
      });
      return patchBobbyLocomotionMoveMs(state, intent.moveDurationMs);
    }
    if (
      intent.item !== MapEntityTypeId.LOCK_KEY ||
      !Number.isInteger(intent.count) ||
      intent.count <= 0
    ) {
      return undefined;
    }
    const lockKeys = readBobbyInventory(state).lockKeys + intent.count;
    commands.emit({
      type: "actor-inventory-item-added",
      entityId: actor.id,
      ...(intent.requestId !== undefined
        ? { requestId: intent.requestId }
        : {}),
      data: { item: intent.item, count: intent.count, total: lockKeys },
    });
    return patchBobbyInventory(state, { lockKeys });
  },
};
