/**
 * 稳定 Definition façade：先加载原版定义，再注册扩展定义。
 * 具体 Terrain/Object 定义分别位于 `original/` 与 `custom/`。
 */
import { registerCustomDefinitions } from "../custom/register.js";
import { markerBehavior } from "./behaviors.js";
import { environmentTraits, HIDDEN_AUTHORING_OBJECTS, pretty } from "./definition-semantics.js";
import { definitionRegistry } from "./definition/registry.js";
import type { DefinitionRegistrationPorts } from "./definition/registration.js";
import type { ObjectType, TerrainType } from "../data/types.js";
import type { TileDefinition, TileTrait } from "./definition-types.js";
import type { TileBehavior } from "./behaviors.js";
import { registerOriginalTerrainDefinitions } from "../original/terrain/definitions.js";
import { registerOriginalObjectDefinitions } from "../original/object/definitions.js";
import { applyTerrainDefinitionAugments } from "../original/terrain/augments.js";
import { applyObjectDefinitionAugments } from "../original/object/augments.js";
import { getObjectDefinition, getTerrainDefinition } from "../original/definitions.js";

const ports: DefinitionRegistrationPorts = {
  defineTerrain(id: TerrainType, category: string, traits: TileTrait[], behaviors: TileBehavior[]) {
    const definition = { id, presentation: { name: pretty(id), category }, traits: [...new Set([...environmentTraits(id), ...traits])], behaviors, authoring: { palette: true } };
    if (definitionRegistry.hasTerrain(id)) definitionRegistry.updateTerrain(definition);
    else definitionRegistry.registerTerrain(definition);
  },
  defineObject(id: ObjectType, category: string, traits: TileTrait[], behaviors: TileBehavior[]) {
    const definition = { id, presentation: { name: pretty(id), category }, traits, behaviors, authoring: { palette: !HIDDEN_AUTHORING_OBJECTS.has(id) } };
    if (definitionRegistry.hasObject(id)) definitionRegistry.updateObject(definition);
    else definitionRegistry.registerObject(definition);
  },
  getTerrain: getTerrainDefinition,
  getObject: getObjectDefinition,
  setObject(definition: TileDefinition<ObjectType>) {
    definitionRegistry.updateObject(definition);
  },
};
registerOriginalTerrainDefinitions({ terrainDef: ports.defineTerrain });
registerOriginalObjectDefinitions({
  object(definition) {
    if (definitionRegistry.hasObject(definition.id)) definitionRegistry.updateObject(definition);
    else definitionRegistry.registerObject(definition);
  },
  objectDef: ports.defineObject,
});
applyTerrainDefinitionAugments(ports);
applyObjectDefinitionAugments(ports);
registerCustomDefinitions(ports);

export * from "../original/definitions.js";
