import type { EntityType, JsonValue } from "@bobby/model";
import type { FootprintDefinition } from "../spatial/Footprint.js";

export type EntityTrait = string;
export type BehaviorId = string;
export type VisualId = string;
export type AudioProfileId = string;

/** Spatial/authoring semantic layer. stackOrder remains ordering only. */
export type EntityLayer = "surface" | "object" | "cover";

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
 * layer 是空间语义；role 是 footprint part 语义；stackOrder 只负责同格排序。
 */
export interface EntityDefinition {
  type: EntityType;
  traits: readonly EntityTrait[];
  layer?: EntityLayer;
  stackOrder?: number;
  footprint?: FootprintDefinition;
  behaviors?: readonly BehaviorId[];
  properties?: readonly EntityFieldDefinition[];
  state?: readonly EntityFieldDefinition[];
}
