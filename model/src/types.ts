export type Direction = "up" | "down" | "left" | "right";

/** Canonical entity type identity. Source folders such as original/custom are not part of this value. */
export type EntityType = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type EntityProperties = Record<string, JsonValue>;
export type EntityState = Record<string, JsonValue>;
export type EntityTraits = string[];

/** One persisted entity anchor in a canonical BC5R map. */
export interface LevelEntity {
  type: EntityType;
  x: number;
  y: number;
  direction?: Direction;
  /** Optional instance-level Spatial ordering override. */
  stackOrder?: number;
  properties?: EntityProperties;
  traits?: EntityTraits;
  /** Initial mutable gameplay state for this entity. */
  state?: EntityState;
}

export type WinCondition =
  | { type: "all"; conditions: WinCondition[] }
  | { type: "any"; conditions: WinCondition[] }
  | { type: "collect-all"; target: string }
  | {
      type: "fill-all";
      target: string;
      filler: string;
    }
  | { type: "reach"; target: string };

/** Global failure/constraint rules. These are not recursive win conditions. */
export type LevelLimit =
  | { type: "max-moves"; moves: number }
  | { type: "max-time-seconds"; seconds: number };

export interface LevelRules {
  win?: WinCondition;
  limits?: LevelLimit[];
}

/** Canonical playable/authorable BC5R map. */
export interface LevelMap {
  schemaVersion: 1;
  width: number;
  height: number;
  entities: LevelEntity[];
  rules?: LevelRules;
}
