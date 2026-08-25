import type { ObjectType, TerrainType } from "../data/types.js";
import {
  EMPTY_OBJECT,
  ObjectId,
  Terrain,
  type Direction,
} from "../mechanics/ids.js";
import {
  directionalPassage,
  fireReflectionBehavior,
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  preEnterBehavior,
  rotateOnLeave,
  type BehaviorDescription,
  type BehaviorRuntimeContext,
  type TileBehavior,
} from "../mechanics/behaviors.js";

import {
  DYNAMIC_IDS,
  HIDDEN_AUTHORING_OBJECTS,
  environmentTraits,
  isWalkableSemantic,
  isWaterSemantic,
  pretty,
} from "../mechanics/definition-semantics.js";
import {
  CAROUSEL_NEXT,
  rotateCarousel,
  toggleColor,
  toggleSpeed,
  toggleTide,
} from "../mechanics/terrain-transforms.js";
import { CLOUD_INFO } from "../mechanics/mechanic-links.js";
import type {
  TileAuthoring,
  TileDefinition,
  TileDefinitionInspection,
  TilePresentation,
  TileTrait,
} from "../mechanics/definition-types.js";
import { definitionRegistry } from "../mechanics/definition/registry.js";
import { inspectDefinition } from "../mechanics/definition/inspection.js";
import { definitionHasTrait } from "../mechanics/traits/queries.js";
export {
  cloudGridForObject,
  tideDirectionForTerrain,
  windmillInfoForObject,
  windSwitchIndexForTerrain,
  windSwitchPeerForTerrain,
} from "../mechanics/mechanic-links.js";
export type {
  TileAuthoring,
  TileDefinition,
  TileDefinitionInspection,
  TilePresentation,
  TileTrait,
} from "../mechanics/definition-types.js";
export function hasTerrainDefinition(id: TerrainType): boolean {
  return definitionRegistry.hasTerrain(id);
}
export function hasObjectDefinition(id: ObjectType): boolean {
  return definitionRegistry.hasObject(id);
}
export function terrainDefinitions(): readonly TileDefinition<TerrainType>[] {
  return definitionRegistry.terrains();
}
export function objectDefinitions(): readonly TileDefinition<ObjectType>[] {
  return definitionRegistry.objects();
}
function variantTerrainDefinition(
  id: TerrainType,
): TileDefinition<TerrainType> {
  const water = isWaterSemantic(id),
    walkable = isWalkableSemantic(id);
  return {
    id,
    presentation: {
      name: pretty(id),
      category: walkable ? "terrain-variant" : "background-variant",
    },
    traits: environmentTraits(id),
    behaviors: [
      markerBehavior(
        walkable ? "ordinary-walkable" : "background",
        "未命名语义变体；行为按已确认类别处理",
      ),
    ],
    authoring: { palette: true },
  };
}
function variantObjectDefinition(id: ObjectType): TileDefinition<ObjectType> {
  return {
    id,
    presentation: { name: pretty(id), category: "object-variant" },
    traits: [],
    behaviors: [
      markerBehavior("unknown-object", "未命名对象变体；没有附加已确认行为"),
    ],
    authoring: { palette: true },
  };
}
export function reflectFireForTerrain(
  id: TerrainType,
  direction: Direction,
): Direction | null | false {
  for (const behavior of getTerrainDefinition(id).behaviors)
    if (behavior.reflectFire) return behavior.reflectFire(direction);
  return null;
}
export function getTerrainDefinition(
  id: TerrainType,
): TileDefinition<TerrainType> {
  const definition = definitionRegistry.terrain(id);
  if (definition) return definition;
  if (id.startsWith("custom:")) throw new Error(`未注册 Custom Terrain：${id}`);
  return variantTerrainDefinition(id);
}
export function getObjectDefinition(
  id: ObjectType,
): TileDefinition<ObjectType> {
  const definition = definitionRegistry.object(id);
  if (definition) return definition;
  if (id.startsWith("custom:")) throw new Error(`未注册 Custom Object：${id}`);
  return variantObjectDefinition(id);
}
export function isObjectAuthorable(id: ObjectType): boolean {
  return getObjectDefinition(id).authoring?.palette !== false;
}
export function terrainHasTrait(id: TerrainType, trait: TileTrait): boolean {
  return definitionHasTrait(getTerrainDefinition(id), trait);
}
export function objectHasTrait(id: ObjectType, trait: TileTrait): boolean {
  return definitionHasTrait(getObjectDefinition(id), trait);
}
export function nextTerrainAfterLeave(id: TerrainType): TerrainType {
  for (const behavior of getTerrainDefinition(id).behaviors) {
    const next = behavior.nextTerrainOnLeave?.(id);
    if (next !== undefined) return next;
  }
  return id;
}
export function runTerrainEnter(
  id: TerrainType,
  ctx: BehaviorRuntimeContext,
  phase: "before-object" | "after-object" = "after-object",
): boolean {
  for (const behavior of getTerrainDefinition(id).behaviors) {
    if (!behavior.onEnter || (behavior.enterPhase ?? "after-object") !== phase)
      continue;
    if (behavior.onEnter(ctx)?.stop) return true;
  }
  return false;
}
export function runTerrainLeave(
  id: TerrainType,
  ctx: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getTerrainDefinition(id).behaviors)
    if (behavior.onLeave?.(ctx)?.stop) return true;
  return false;
}
export function runObjectEnter(
  id: ObjectType,
  ctx: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getObjectDefinition(id).behaviors)
    if (behavior.onEnter?.(ctx)?.stop) return true;
  return false;
}
export function runObjectLeave(
  id: ObjectType,
  ctx: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getObjectDefinition(id).behaviors)
    if (behavior.onLeave?.(ctx)?.stop) return true;
  return false;
}
export function inspectTerrainDefinition(
  id: TerrainType,
): TileDefinitionInspection {
  return inspectDefinition(getTerrainDefinition(id));
}
export function inspectObjectDefinition(
  id: ObjectType,
): TileDefinitionInspection {
  return inspectDefinition(getObjectDefinition(id));
}
