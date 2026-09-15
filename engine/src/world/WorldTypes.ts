import type { Direction, GoalType, JsonValue } from "@bobby/model";
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
  text?: string;
}

export type MissingItemKind = string;

export interface MissingItemEvent extends WorldEvent {
  type: "missing-item";
  actorId: EntityId;
  entityId: EntityId;
  x: number;
  y: number;
  data: {
    item: MissingItemKind;
  };
}

export function isMissingItemEvent(
  event: WorldEvent,
): event is MissingItemEvent {
  return (
    event.type === "missing-item" &&
    event.actorId !== undefined &&
    event.entityId !== undefined &&
    event.x !== undefined &&
    event.y !== undefined &&
    event.data !== undefined &&
    typeof event.data.item === "string"
  );
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
    (event.text === undefined || typeof event.text === "string") &&
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
      type: GoalType;
      completed: boolean;
      remaining?: number;
    };

export interface PresenceInspection {
  entityId: EntityId;
  type: string;
  role?: string;
  stackOrder: number;
  facts: readonly string[];
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
