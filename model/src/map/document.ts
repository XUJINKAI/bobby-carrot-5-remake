import type { JsonPrimitive } from "../shared/json.js";
import type { LevelRules } from "./rules.js";

export type Direction = "up" | "down" | "left" | "right";

/** Canonical Entity identity. Source folders such as original/custom are not part of this value. */
export type EntityType = string;

/** LevelMap.entities[] public persisted shape. Entity-specific top-level fields are type-owned. */
export interface LevelEntity {
  type: EntityType;
  x: number;
  y: number;
  /** Common typed field; EntityMapDefinition decides which Entity types may persist it. */
  direction?: Direction;
  stackOrder?: number;
  [key: string]: JsonPrimitive | undefined;
}

export type MusicTrackId = string;
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
