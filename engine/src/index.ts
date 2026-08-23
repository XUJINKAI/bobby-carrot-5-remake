export { Game, type GameOptions } from './core/Game.js';
export { InputController } from './input/InputController.js';
export { NullAudioBackend, type AudioBackend } from './audio/AudioBackend.js';
export {
  fetchJson,
  type LevelData,
  type LevelCatalog,
  type CatalogLevel,
  type LevelObject,
  type LevelSource,
  type TerrainType,
  type ObjectType
} from './data/types.js';
export { type TileInspection, type MoveResult, type Point } from './world/World.js';
export {
  Terrain,
  ObjectId,
  EMPTY_OBJECT,
  DIRECTIONS,
  DYNAMIC_OBJECT_IDS,
  CLOUD_OBJECT_IDS,
  CLOUD_GRID_FOR_OBJECT,
  type Direction
} from './mechanics/ids.js';
export {
  getTerrainDefinition,
  getObjectDefinition,
  inspectTerrainDefinition,
  inspectObjectDefinition,
  type TileDefinition,
  type TileDefinitionInspection,
  type TilePresentation,
  type TileSourceMetadata,
  type TileTrait
} from './mechanics/definitions.js';
export {
  objectLayoutFor,
  isMultiCellObject,
  isObjectLayoutPart,
  objectVariantCycle,
  transformObjectVariant,
  expandObjectLayouts,
  collapseObjectLayouts,
  type ObjectLayout,
  type ObjectLayoutCell
} from './mechanics/object-layouts.js';
export {
  directionalPassage,
  rotateOnLeave,
  passageBehavior,
  enterBehavior,
  preEnterBehavior,
  leaveBehavior,
  fireReflectionBehavior,
  markerBehavior,
  type TileBehavior,
  type BehaviorDescription
} from './mechanics/behaviors.js';
export { terrainAtlasCell, objectAtlasCell, type AtlasCell } from './render/atlas.js';
