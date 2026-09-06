export type Direction = "up" | "down" | "left" | "right";

/** Canonical Entity identity. Source folders such as original/custom are not part of this value. */
export type EntityType = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * LevelMap.entities[] 的公共持久化形状。
 * 除 type/x/y/stackOrder 外，其余顶层字段由 EntityMapDefinition 按 type 精确约束。
 */
export interface LevelEntity {
  type: EntityType;
  x: number;
  y: number;
  /** Optional instance-level Spatial ordering override. */
  stackOrder?: number;
  [key: string]: JsonPrimitive | undefined;
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

/** Logical music track ID. Playback style such as modern/8bit is runtime configuration. */
export type MusicTrackId = string;

/** "random" / "none" are reserved map-level policies; other strings are logical track IDs. */
export type MapMusic = "random" | "none" | MusicTrackId;

/** Pure playable Engine input. */
export interface LevelMap {
  schemaVersion: 1;
  width: number;
  height: number;
  music?: MapMusic;
  /** In-game note/presentation text that belongs to this map. */
  note?: string;
  entities: LevelEntity[];
  rules?: LevelRules;
}

/** Human-facing metadata carried by a standalone map document. */
export interface MapMeta {
  name: string;
  author?: string;
}

/** Canonical source/built/share map document. Resource identity comes from path/filename. */
export interface MapDocument extends LevelMap {
  meta: MapMeta;
}
