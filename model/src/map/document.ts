import type { JsonPrimitive } from "../shared/json.js";
import type { LevelRules } from "./rules.js";

export type Direction = "up" | "down" | "left" | "right";

/** Canonical Entity 身份；original/custom 等源码目录不属于该值。 */
export type EntityType = string;

/** LevelMap.entities[] 的公开持久化形状；类型专属顶层字段由对应 Definition 管理。 */
export interface LevelEntity {
  type: EntityType;
  x: number;
  y: number;
  /** 公共类型字段；具体 Entity 是否允许持久化由 EntityMapDefinition 决定。 */
  direction?: Direction;
  stackOrder?: number;
  [key: string]: JsonPrimitive | undefined;
}

export type MusicTrackId = string;
export type MapMusic = "random" | "none" | MusicTrackId;

/** 可直接游玩的纯 Engine 输入。 */
export interface LevelMap {
  schemaVersion: 1;
  music?: MapMusic;
  /** 属于地图内容的游戏内注记或表现文本。 */
  note?: string;
  rules?: LevelRules;
  width: number;
  height: number;
  entities: LevelEntity[];
}

/** 独立地图文档携带的面向用户 metadata。 */
export interface MapMeta {
  name: string;
  author?: string;
}

/** 源文件、构建产物与分享共用的地图文档；资源身份来自路径或文件名。 */
export interface MapDocument extends LevelMap {
  meta: MapMeta;
}
