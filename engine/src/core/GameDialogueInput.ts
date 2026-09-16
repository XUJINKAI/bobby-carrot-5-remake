import type { Direction } from "@bobby/model";
import type { World } from "../world/World.js";
import type { WorldIntentGroup } from "../world/movement/WorldIntent.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { DialogueRequestEvent } from "../world/WorldTypes.js";

/** 对话关闭后的方向动作属于 Game 输入队列，等发起者可行动时才提交。 */
export class GameDialogueInput {
  private readonly pending: Array<{
    actorId: EntityId;
    direction: Direction;
  }> = [];

  directionFor(world: World | null, request: DialogueRequestEvent): Direction | null {
    const actor = world?.entity(request.actorId);
    if (!actor) return null;
    const dx = request.x - actor.anchor.x;
    const dy = request.y - actor.anchor.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
    if (dy !== 0) return dy < 0 ? "up" : "down";
    return actor.direction ?? null;
  }

  queue(world: World | null, actorId: EntityId, direction: Direction): void {
    if (!world?.query.entityHasFact(actorId, "player")) return;
    if (world.dead || world.completed) return;
    this.pending.push({ actorId, direction });
  }

  ready(world: World): WorldIntentGroup[] {
    const groups: WorldIntentGroup[] = [];
    for (let index = 0; index < this.pending.length;) {
      const move = this.pending[index]!;
      if (!world.query.entityHasFact(move.actorId, "player")) {
        this.pending.splice(index, 1);
        continue;
      }
      if (world.isInputBlockedFor(move.actorId)) {
        index += 1;
        continue;
      }
      groups.push({
        intents: [{
          type: "move",
          actorId: move.actorId,
          direction: move.direction,
          cause: {
            type: "player-input",
            source: "dialogue",
            inputDirection: move.direction,
          },
        }],
        historyBoundary: true,
      });
      this.pending.splice(index, 1);
    }
    return groups;
  }

  clear(): void {
    this.pending.length = 0;
  }
}
