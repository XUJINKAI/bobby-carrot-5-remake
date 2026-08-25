import type { ObjectType, TerrainType } from "../../data/types.js";
import type { TileDefinition } from "../definition-types.js";

/**
 * Definition Registry 只维护静态语义定义。
 * 地图加载和 gameplay 状态不进入这里，避免注册表承担 Runtime 职责。
 */
export class DefinitionRegistry {
  private readonly terrainDefinitions = new Map<
    TerrainType,
    TileDefinition<TerrainType>
  >();
  private readonly objectDefinitions = new Map<
    ObjectType,
    TileDefinition<ObjectType>
  >();

  registerTerrain(definition: TileDefinition<TerrainType>): void {
    this.terrainDefinitions.set(definition.id, definition);
  }

  registerObject(definition: TileDefinition<ObjectType>): void {
    this.objectDefinitions.set(definition.id, definition);
  }

  terrain(id: TerrainType): TileDefinition<TerrainType> | undefined {
    return this.terrainDefinitions.get(id);
  }

  object(id: ObjectType): TileDefinition<ObjectType> | undefined {
    return this.objectDefinitions.get(id);
  }
}

export const definitionRegistry = new DefinitionRegistry();
