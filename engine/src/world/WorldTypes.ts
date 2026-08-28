import type { Direction, EntityState, JsonValue } from "@bobby/model";
import type { EntityId } from "./entity/EntityInstance.js";
import type { StackBand } from "./spatial/StackBand.js";

/** World 对外只暴露语义事件，不暴露 Terrain/Object 历史模型。 */
export interface WorldEvent {
  type: string;
  entityId?: EntityId;
  x?: number;
  y?: number;
  direction?: Direction;
  action?: string;
  text?: string;
  messageId?: string;
  reason?: string;
  data?: Record<string, JsonValue>;
}

/** 当前 World 对一棵通关条件树的统一求值结果。 */
export type WinConditionState =
  | {
      type: "all";
      completed: boolean;
      conditions: WinConditionState[];
    }
  | {
      type: "any";
      completed: boolean;
      conditions: WinConditionState[];
    }
  | {
      type: "collect-all";
      target: string;
      completed: boolean;
      remaining: number;
    }
  | {
      type: "fill-all";
      target: string;
      filler: string;
      completed: boolean;
      remaining: number;
    }
  | {
      type: "reach";
      target: string;
      completed: boolean;
    };

export interface PresenceInspection {
  entityId: EntityId;
  type: string;
  role?: string;
  stackBand: StackBand;
  traits: readonly string[];
  state?: EntityState;
}

export interface CellInspection {
  cell: { x: number; y: number };
  presences: readonly PresenceInspection[];
  topPresence?: PresenceInspection;
  playerHere: boolean;
}

export interface PassageInfo {
  reason: string;
  confidence: "rule" | "fallback";
}

export interface MoveResult {
  moved: boolean;
  blocked?: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  direction: Direction;
  passage: PassageInfo;
  events: WorldEvent[];
}
