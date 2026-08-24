import type { LevelObject, ObjectType, TerrainType } from "@bobby/model";
import type { Direction } from "../mechanics/ids.js";
import type { PassageResult } from "../mechanics/rules.js";
import type { TileDefinitionInspection } from "../mechanics/definitions.js";
import type { DynamicEntity, Point } from "./RuntimeState.js";

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
    | "object-interaction"
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
  x?: number;
  y?: number;
  objectType?: ObjectType;
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
export interface TileInspection {
  x: number;
  y: number;
  terrainType: TerrainType;
  terrainDefinition: TileDefinitionInspection;
  object: LevelObject | null;
  objectType: ObjectType;
  objectDefinition: TileDefinitionInspection;
  dynamicEntity: DynamicEntity | null;
  isPlayer: boolean;
  isStart: boolean;
}
