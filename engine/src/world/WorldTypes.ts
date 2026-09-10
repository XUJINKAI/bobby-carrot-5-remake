import type { Direction, JsonValue } from "@bobby/model";
import type { EntityLayer } from "./entity/EntityDefinition.js";
import type { EntityId, EntityState } from "./entity/EntityInstance.js";

/** World 对外只暴露语义事件，不暴露 Terrain/Object 历史模型。 */
export interface WorldEvent {
  type: string;
  /** 发起交互的 actor；entityId 保持表示被交互的对象。 */
  actorId?: EntityId;
  entityId?: EntityId;
  requestId?: number;
  objectType?: string;
  role?: string;
  x?: number;
  y?: number;
  direction?: Direction;
  action?: string;
  text?: string;
  reason?: string;
  data?: Record<string, JsonValue>;
}

export interface ObjectInteractionEvent extends WorldEvent {
  type: "object-interaction";
  actorId: EntityId;
  entityId: EntityId;
  requestId: number;
  objectType: string;
  x: number;
  y: number;
  action: "touch" | "enter";
}

export function isObjectInteractionEvent(
  event: WorldEvent,
): event is ObjectInteractionEvent {
  return (
    event.type === "object-interaction" &&
    event.actorId !== undefined &&
    event.entityId !== undefined &&
    event.requestId !== undefined &&
    typeof event.objectType === "string" &&
    event.x !== undefined &&
    event.y !== undefined &&
    (event.action === "touch" || event.action === "enter")
  );
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
  layer: EntityLayer;
  role?: string;
  stackOrder: number;
  traits: readonly string[];
  state?: EntityState;
}

export interface CellInspection {
  cell: { x: number; y: number };
  presences: readonly PresenceInspection[];
  topPresence?: PresenceInspection;
  /** IDs of controllable/player entities currently projected into this cell. */
  actorIds: readonly EntityId[];
}

export interface PassageInfo {
  reason: string;
  confidence: "rule" | "fallback";
}

export interface MoveResult {
  actorId?: EntityId;
  moved: boolean;
  blocked?: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  direction: Direction;
  passage: PassageInfo;
  events: WorldEvent[];
}
