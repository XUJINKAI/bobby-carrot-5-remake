import type { Direction, EntityState, LevelEntity } from "@bobby/model";
import type { WorldTick } from "../../time/WorldClock.js";
import type { GlobalState } from "../GlobalState.js";
import type {
  RuntimeActionId,
  RuntimeActionSpec,
} from "../action/RuntimeAction.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { WorldEvent } from "../WorldTypes.js";
import type { WorldCommandApi } from "./CommandQueue.js";
import type { WorldQueryApi } from "./WorldQueryApi.js";

export interface BehaviorSubject {
  readonly entity: Readonly<EntityInstance>;
  readonly presence: Readonly<EntityPresence>;
}

export interface PassageResult {
  passable: boolean;
  reason?: string;
}

export interface BehaviorContext {
  readonly actor: Readonly<EntityInstance>;
  readonly self: BehaviorSubject;
  readonly query: WorldQueryApi;
  readonly commands: WorldCommandApi;
  readonly direction?: Direction;
  /** 仅 onTick 提供，由 WorldClock 统一产生。 */
  readonly time?: WorldTick;
}

/** Trait/Definition 选择 Behavior；Behavior 只通过 Query + Command 与 World 交互。 */
export interface Behavior {
  id: string;
  canEnter?(context: BehaviorContext): PassageResult | void;
  canLeave?(context: BehaviorContext): PassageResult | void;
  onTouch?(context: BehaviorContext): void;
  onEnter?(context: BehaviorContext): void;
  onLeave?(context: BehaviorContext): void;
  onTick?(context: BehaviorContext): void;
  onDestroy?(context: BehaviorContext): void;
}

export interface SetStateCommand {
  type: "set-state";
  entityId: EntityId;
  state: EntityState;
}

export type BehaviorCommand =
  | { type: "spawn"; entity: LevelEntity }
  | { type: "destroy"; entityId: EntityId }
  | { type: "move"; entityId: EntityId; x: number; y: number }
  | { type: "set-direction"; entityId: EntityId; direction: Direction }
  | SetStateCommand
  | {
      type: "set-global";
      key: keyof GlobalState;
      value: GlobalState[keyof GlobalState];
    }
  | { type: "start-action"; action: RuntimeActionSpec }
  | { type: "cancel-action"; actionId: RuntimeActionId }
  | { type: "emit"; event: WorldEvent };
