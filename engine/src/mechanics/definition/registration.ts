import type { ObjectType, TerrainType } from "../../data/types.js";
import type { TileBehavior } from "../behaviors.js";
import type { TileAuthoring, TileTrait } from "../definition-types.js";

/** 具体 Terrain/Object 模块注册 Definition 时使用的最小端口。 */
export interface DefinitionRegistrationPorts {
  defineObject(
    id: ObjectType,
    category: string,
    traits: TileTrait[],
    behaviors: TileBehavior[],
    authoring?: TileAuthoring,
  ): void;
  defineTerrain(
    id: TerrainType,
    category: string,
    traits: TileTrait[],
    behaviors: TileBehavior[],
  ): void;
}
