import type { Direction, EntityType } from "@bobby/model";
import type { EntityId, EntityInstance } from "./entity/EntityInstance.js";
import type { EntityPresence } from "./spatial/EntityPresence.js";

export interface Point {
  x: number;
  y: number;
}

export interface PassageResult {
  passable: boolean;
  reason: string;
  confidence: "confirmed" | "inferred";
}

export interface WorldEvent {
  type:
    | "collect-carrot"
    | "fill-nest"
    | "collect-gas"
    | "collect-kite"
    | "collect-shovel"
    | "collect-bean"
    | "collect-golden-carrot"
    | "collect-bonus-coin"
    | "entity-interaction"
    | "dialog"
    | "board-mower"
    | "leave-mower"
    | "mow"
    | "break-rock"
    | "toggle-switch"
    | "dragon-fire"
    | "melt-ice"
    | "plant-bean"
    | "beanstalk-grow"
    | "death"
    | "complete"
    | "warning";
  message: string;
  text?: string;
  messageId?: string;
  x?: number;
  y?: number;
  entityId?: EntityId;
  entityType?: EntityType;
  action?: string;
}

export interface MoveResult {
  moved: boolean;
  from: Point;
  to: Point;
  passage: PassageResult;
  events: WorldEvent[];
  forcedDirection: Direction | null;
  forcedKind: string | null;
  dead: boolean;
  completed: boolean;
}

export interface PresenceInspection {
  presence: EntityPresence;
  entity: EntityInstance;
}

export interface TileInspection {
  x: number;
  y: number;
  presences: PresenceInspection[];
  top: PresenceInspection | null;
  isPlayer: boolean;
}
