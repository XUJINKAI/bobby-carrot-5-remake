import type { EntityState } from "@bobby/model";
import type { RuntimeActionId } from "../action/RuntimeAction.js";
import type { GlobalState } from "../GlobalState.js";
import type { ActorLifecycleState } from "../actor/ActorLifecycle.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { WorldEvent } from "../WorldTypes.js";
import type { WorldMotion } from "../movement/WorldMotion.js";
import type { WorldOutcomeState } from "../outcome/WorldOutcome.js";

export interface WorldDeltaBase {
  sequence: number;
  worldTick: number | null;
  worldTimeMs: number;
}

export type WorldDeltaPayload =
  | { type: "entity-spawned"; entityId: EntityId }
  | { type: "entity-destroyed"; entityId: EntityId }
  | {
      type: "entity-moved";
      entityId: EntityId;
      from: CellPosition;
      to: CellPosition;
    }
  | { type: "entity-direction-changed"; entityId: EntityId }
  | { type: "entity-state-changed"; entityId: EntityId; state: EntityState }
  | { type: "global-state-changed"; key: keyof GlobalState }
  | { type: "actor-lifecycle-changed"; actor: ActorLifecycleState }
  | { type: "world-outcome-changed"; outcome: WorldOutcomeState }
  | { type: "action-started"; actionId: RuntimeActionId }
  | { type: "action-cancelled"; actionId: RuntimeActionId }
  | { type: "world-event"; event: WorldEvent }
  | { type: "motion-started"; motion: WorldMotion }
  | { type: "motion-progressed"; motion: WorldMotion }
  | { type: "motion-marker"; motion: WorldMotion; marker: string }
  | { type: "motion-completed"; motion: WorldMotion }
  | { type: "motion-interrupted"; motion: WorldMotion };

/** 一次 World 推进产生的有序语义事实，供 Presentation、Debug 与外层事件桥消费。 */
export type WorldDelta = WorldDeltaBase & WorldDeltaPayload;

export class WorldDeltaSequence {
  private nextSequence = 1;

  create(
    payload: WorldDeltaPayload,
    clock: { worldTick: number | null; worldTimeMs: number },
  ): WorldDelta {
    return {
      sequence: this.nextSequence++,
      worldTick: clock.worldTick,
      worldTimeMs: clock.worldTimeMs,
      ...structuredClone(payload),
    } as WorldDelta;
  }
}
