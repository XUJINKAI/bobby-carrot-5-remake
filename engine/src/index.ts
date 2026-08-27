export {
  Game,
  type GameOptions,
  type GameRuntimeOptions,
} from "./core/Game.js";
export {
  createGameplayRuntime,
  type GameplayRuntime,
  type GameplayRuntimeConfig,
  type CreateGameplayRuntimeOptions,
} from "./core/GameplayRuntime.js";
export {
  InputController,
  type InputControllerOptions,
} from "./input/InputController.js";
export {
  ScreenJoystick,
  directionForJoystickVector,
  type ScreenJoystickOptions,
  type JoystickVectorState,
} from "./input/ScreenJoystick.js";
export {
  GameplayHud,
  type GameplayHudOptions,
} from "./ui/GameplayHud.js";
export { NullAudioBackend, type AudioBackend } from "./audio/AudioBackend.js";
export type {
  LevelMap,
  LevelObject,
  LevelObjectProperties,
  TerrainType,
  ObjectType,
} from "@bobby/model";
export {
  type TileInspection,
  type MoveResult,
  type Point,
  type WorldEvent,
} from "./world/World.js";
export { World } from "./world/World.js";
export { resolveLevelPlayerStart } from "./world/level-start.js";
export {
  Terrain,
  ObjectId,
  CustomObjectId,
  CustomTerrain,
  EMPTY_OBJECT,
  DIRECTIONS,
  DYNAMIC_OBJECT_IDS,
  CLOUD_OBJECT_IDS,
  CLOUD_GRID_FOR_OBJECT,
  type Direction,
} from "./mechanics/ids.js";
export {
  getTerrainDefinition,
  getObjectDefinition,
  inspectTerrainDefinition,
  inspectObjectDefinition,
  isObjectAuthorable,
  hasTerrainDefinition,
  hasObjectDefinition,
  terrainDefinitions,
  objectDefinitions,
  terrainHasTrait,
  type TileDefinition,
  type TileDefinitionInspection,
  type TilePresentation,
  type TileAuthoring,
  type TileTrait,
} from "./mechanics/definitions.js";
export type {
  ObjectPropertyDefinition,
  StringPropertyDefinition,
  EnumPropertyDefinition,
  EnumPropertyOption,
} from "./mechanics/definition-types.js";
export {
  objectLayoutFor,
  isMultiCellObject,
  isObjectLayoutPart,
  objectVariantCycle,
  transformObjectVariant,
  expandObjectLayouts,
  collapseObjectLayouts,
  type ObjectLayout,
  type ObjectLayoutCell,
} from "./mechanics/object-layouts.js";
export {
  directionalPassage,
  rotateOnLeave,
  passageBehavior,
  touchBehavior,
  enterBehavior,
  preEnterBehavior,
  leaveBehavior,
  fireReflectionBehavior,
  markerBehavior,
  type TileBehavior,
  type BehaviorDescription,
  type ObjectTouchResult,
} from "./mechanics/behaviors.js";
export {
  terrainAtlasCell,
  objectAtlasCell,
  type AtlasCell,
} from "./render/atlas.js";
export { drawCustomObject, drawCustomTerrain, customTileIconStyle } from "./render/custom-tiles.js";
