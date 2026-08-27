import type { EntityType, JsonValue } from "@bobby/model";
import type { FootprintDefinition } from "../spatial/Footprint.js";
import type { StackBand } from "../spatial/StackBand.js";

export type EntityTrait = string;
export type BehaviorId = string;
export type VisualId = string;
export type AudioProfileId = string;

export interface OccupancyDefinition {
  group?: string;
  replaceSameGroup?: boolean;
}

export type EntityFieldKind = "string" | "number" | "boolean" | "enum";

export interface EntityFieldOption {
  value: JsonValue;
  label?: string;
}

/** Editor Inspector 与实例校验共用的声明式字段定义。 */
export interface EntityFieldDefinition {
  key: string;
  kind: EntityFieldKind;
  label?: string;
  default?: JsonValue;
  options?: readonly EntityFieldOption[];
}

export interface EntityPresentationDefinition {
  name: string;
  category?: string;
  visual?: VisualId;
  audio?: AudioProfileId;
}

export interface EntityAuthoringDefinition {
  palette?: boolean;
  category?: string;
}

/** 一种 Entity 的共享静态定义。 */
export interface EntityDefinition {
  type: EntityType;
  traits: readonly EntityTrait[];
  stackBand: StackBand;
  stackOrder?: number;
  occupancy?: OccupancyDefinition;
  footprint?: FootprintDefinition;
  behaviors?: readonly BehaviorId[];
  properties?: readonly EntityFieldDefinition[];
  state?: readonly EntityFieldDefinition[];
  presentation: EntityPresentationDefinition;
  authoring?: EntityAuthoringDefinition;
}
