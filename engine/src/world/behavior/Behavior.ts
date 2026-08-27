import type { Direction, EntityState, LevelEntity } from "@bobby/model";
import type { GlobalState } from "../GlobalState.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { PassageResult, WorldEvent } from "../WorldTypes.js";
import type { WorldCommandApi } from "./CommandQueue.js";
import type { WorldQueryApi } from "./WorldQueryApi.js";

export interface BehaviorSubject {
  entity: EntityInstance;
  presence: EntityPresence;
}

export interface BehaviorContext {
  readonly actor: EntityInstance;
  readonly self: BehaviorSubject;
  readonly direction: Direction;
  readonly globals: Readonly<GlobalState>;
  readonly query: WorldQueryApi;
  readonly command: WorldCommandApi;
}

export interface TickBehaviorContext {
  readonly self: BehaviorSubject;
  readonly deltaMs: number;
  readonly globals: Readonly<GlobalState>;
  readonly query: WorldQueryApi;
  readonly command: WorldCommandApi;
}

/** Trait/Definition 选择 Behavior；Behavior 只通过 Query + Command 与 World 交互。 */
export interface Behavior {
  id: string;
  canEnter?(context: BehaviorContext): PassageResult | void;
  canLeave?(context: BehaviorContext): PassageResult | void;
  onTouch?(context: BehaviorContext): void;
  onEnter?(context: BehaviorContext): void;
  onLeave?(context: BehaviorContext): void;
  onTick?(context: TickBehaviorContext): void;
  onDestroy?(context: TickBehaviorContext): void;
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
  | { type: "set-global"; key: keyof GlobalState; value: GlobalState[keyof GlobalState] }
  | { type: "emit"; event: WorldEvent };
