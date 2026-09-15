import type { Direction } from "@bobby/model";
import type { CellPosition } from "../../world/entity/EntityInstance.js";
import type { PushPipelineMechanism } from "../../world/movement/MovementPipeline.js";

/** Push 提出唯一候选，目标格合法性和同组预留由 World 继续裁决。 */
export const pushMechanism: PushPipelineMechanism = {
  id: "push",
  isPushable(presence) {
    return presence.facts.includes("pushable");
  },
  propose(actorId, target, direction, stack) {
    const candidate = stack.find(
      (presence) =>
        presence.entityId !== actorId &&
        this.isPushable(presence),
    );
    if (!candidate) return null;
    return {
      entityId: candidate.entityId,
      from: target,
      to: addDirection(target, direction),
    };
  },
};

function addDirection(cell: CellPosition, direction: Direction): CellPosition {
  if (direction === "up") return { x: cell.x, y: cell.y - 1 };
  if (direction === "down") return { x: cell.x, y: cell.y + 1 };
  if (direction === "left") return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}
