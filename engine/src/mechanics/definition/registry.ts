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
    if (this.terrainDefinitions.has(definition.id))
      throw new Error(`Terrain Definition 重复注册：${definition.id}`);
    this.terrainDefinitions.set(definition.id, definition);
  }

  registerObject(definition: TileDefinition<ObjectType>): void {
    if (this.objectDefinitions.has(definition.id))
      throw new Error(`Object Definition 重复注册：${definition.id}`);
    this.objectDefinitions.set(definition.id, definition);
  }

  terrain(id: TerrainType): TileDefinition<TerrainType> | undefined {
    return this.terrainDefinitions.get(id);
  }

  object(id: ObjectType): TileDefinition<ObjectType> | undefined {
    return this.objectDefinitions.get(id);
  }

  updateObject(definition: TileDefinition<ObjectType>): void {
    if (!this.objectDefinitions.has(definition.id))
      throw new Error(`Object Definition 尚未注册：${definition.id}`);
    this.objectDefinitions.set(definition.id, definition);
  }

  updateTerrain(definition: TileDefinition<TerrainType>): void {
    if (!this.terrainDefinitions.has(definition.id))
      throw new Error(`Terrain Definition 尚未注册：${definition.id}`);
    this.terrainDefinitions.set(definition.id, definition);
  }

  hasTerrain(id: TerrainType): boolean {
    return this.terrainDefinitions.has(id);
  }
  hasObject(id: ObjectType): boolean {
    return this.objectDefinitions.has(id);
  }
  terrains(): readonly TileDefinition<TerrainType>[] {
    return [...this.terrainDefinitions.values()];
  }
  objects(): readonly TileDefinition<ObjectType>[] {
    return [...this.objectDefinitions.values()];
  }
}

export const definitionRegistry = new DefinitionRegistry();
