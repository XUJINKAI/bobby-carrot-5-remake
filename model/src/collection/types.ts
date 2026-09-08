import type { EntityType } from "../map/document.js";
import type { JsonPrimitive } from "../shared/json.js";

/** 基于 Entity 的 collection icon；类型专属字段共用扁平 Entity Map ABI。 */
export interface MapCollectionEntityIcon {
  type: EntityType;
  [key: string]: JsonPrimitive;
}

export type MapCollectionIcon =
  | { type: "entity"; entity: MapCollectionEntityIcon }
  | { type: "image"; src: string }
  | { type: "text"; value: string };

export type MapCollectionCardSize = "small" | "medium" | "big";

export interface MapCollectionFilterOption {
  id: string;
  name: string;
  icon?: MapCollectionIcon;
}

export interface MapCollectionFilter {
  id: string;
  name: string;
  options: MapCollectionFilterOption[];
}

export interface MapCollectionChapter {
  id: string;
  name: string;
  description?: string;
  difficulty?: number;
}

/** Runtime collection entry；Original 专属 kind/filters 是可选扩展。 */
export interface MapCollectionMap {
  id: string;
  name: string;
  description?: string;
  chapter?: string;
  kind?: string;
  filters?: Record<string, string[]>;
}

/** assets/maps/<collection>/index.json；collection 身份来自资源路径。 */
export interface MapCollectionIndex {
  schemaVersion: 1;
  name: string;
  description?: string;
  cardSize: MapCollectionCardSize;
  filters: MapCollectionFilter[];
  chapters: MapCollectionChapter[];
  maps: MapCollectionMap[];
}

export interface MapCollectionSummary {
  /** 用于解析 assets/maps/<id>/index.json 的资源路径 ID。 */
  id: string;
  name: string;
  description?: string;
}

/** assets/maps/index.json；collections[] 数组顺序即展示与导航顺序。 */
export interface MapCollectionsIndex {
  schemaVersion: 1;
  collections: MapCollectionSummary[];
}

export interface CollectionManifestChapter {
  name?: string;
  description?: string;
}

/**
 * 人工维护的 collection metadata；成员关系及 chapter/map ID 由文件路径定义。
 * chapters 只补充一级 chapter 目录的展示信息，省略时使用目录 ID 作为名称。
 */
export interface CollectionManifestEntry {
  id: string;
  name: string;
  description?: string;
  cardSize?: MapCollectionCardSize;
  chapters?: Record<string, CollectionManifestChapter>;
}

/** custom-maps/collections.json；collections[] 数组顺序即 collection 顺序。 */
export interface CollectionManifest {
  schemaVersion: 1;
  collections: CollectionManifestEntry[];
}
