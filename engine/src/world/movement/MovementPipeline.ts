import type { Direction } from "@bobby/model";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";

export interface PushCandidate {
  readonly entityId: EntityId;
  readonly from: CellPosition;
  readonly to: CellPosition;
}

/** Pipeline 只解释语义并提出候选；World 保留占用、预留与提交裁决。 */
export interface PushPipelineMechanism {
  readonly id: string;
  isPushable(presence: Readonly<EntityPresence>): boolean;
  propose(
    actorId: EntityId,
    target: CellPosition,
    direction: Direction,
    stack: readonly EntityPresence[],
  ): PushCandidate | null;
}

export interface PassagePipelineMechanism {
  readonly id: string;
  isWalkable(stack: readonly EntityPresence[]): boolean;
  isBlocking(presence: Readonly<EntityPresence>): boolean;
}
