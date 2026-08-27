import type { Direction, EntityType, JsonValue } from "@bobby/model";
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

/**
 * 一种 Entity 的纯 gameplay/domain 静态定义。
 * 展示与编辑器元数据属于 EntityModule / EntityCatalog，不进入 World 的 Definition。
 */
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
}
