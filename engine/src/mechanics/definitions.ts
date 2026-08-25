/**
 * 稳定 Definition façade：先加载原版定义，再注册扩展定义。
 * 具体 Terrain/Object 定义分别位于 `original/` 与 `custom/`。
 */
import { registerCustomDefinitions } from "../custom/register.js";
import { environmentTraits, HIDDEN_AUTHORING_OBJECTS, pretty } from "./definition-semantics.js";
import { definitionRegistry } from "./definition/registry.js";
import type { DefinitionRegistrationPorts } from "./definition/registration.js";
import type { ObjectType, TerrainType } from "../data/types.js";
import type { TileAuthoring, TileDefinition, TileTrait } from "./definition-types.js";
import type { TileBehavior } from "./behaviors.js";
import { registerOriginalTerrainDefinitions } from "../original/terrain/index.js";
import { registerOriginalObjectDefinitions } from "../original/object/index.js";
import { completeOriginalObjectDefinition } from "../original/object/complete-definition.js";

function terrainDefinition(
  id: TerrainType,
  category: string,
  traits: TileTrait[],
  behaviors: TileBehavior[],
): TileDefinition<TerrainType> {
  return {
    id,
    presentation: { name: pretty(id), category },
    traits: [...new Set([...environmentTraits(id), ...traits])],
    behaviors,
    authoring: { palette: true },
  };
}

function objectDefinition(
  id: ObjectType,
  category: string,
  traits: TileTrait[],
  behaviors: TileBehavior[],
  authoring?: TileAuthoring,
): TileDefinition<ObjectType> {
  return {
    id,
    presentation: { name: pretty(id), category },
    traits,
    behaviors,
    authoring: authoring ?? { palette: !HIDDEN_AUTHORING_OBJECTS.has(id) },
  };
}

const ports: DefinitionRegistrationPorts = {
  defineTerrain(id: TerrainType, category: string, traits: TileTrait[], behaviors: TileBehavior[]) {
    definitionRegistry.registerTerrain(terrainDefinition(id, category, traits, behaviors));
  },
  defineObject(id: ObjectType, category: string, traits: TileTrait[], behaviors: TileBehavior[], authoring) {
    definitionRegistry.registerObject(objectDefinition(id, category, traits, behaviors, authoring));
  },
};

const originalTerrains = new Map<TerrainType, TileDefinition<TerrainType>>();
registerOriginalTerrainDefinitions({
  terrainDef(id, category, traits, behaviors) {
    originalTerrains.set(id, terrainDefinition(id, category, traits, behaviors));
  },
});
for (const definition of originalTerrains.values())
  definitionRegistry.registerTerrain(definition);

const originalObjects = new Map<ObjectType, TileDefinition<ObjectType>>();
registerOriginalObjectDefinitions({
  object(definition) {
    originalObjects.set(definition.id, definition);
  },
  objectDef(id, category, traits, behaviors) {
    originalObjects.set(id, objectDefinition(id, category, traits, behaviors));
  },
});
for (const definition of originalObjects.values())
  definitionRegistry.registerObject(completeOriginalObjectDefinition(definition));
registerCustomDefinitions(ports);

export * from "./definition/catalog.js";
