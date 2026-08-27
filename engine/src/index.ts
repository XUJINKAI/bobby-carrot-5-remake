export { Game, type GameOptions, type GameRuntimeOptions } from "./core/Game.js";
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
export { GameplayHud, type GameplayHudOptions } from "./ui/GameplayHud.js";
export { NullAudioBackend, type AudioBackend } from "./audio/AudioBackend.js";
export { EntityTypeId } from "@bobby/model";
export type {
  Direction,
  EntityProperties,
  EntityState,
  EntityTraits,
  EntityType,
  JsonValue,
  LevelEntity,
  LevelMap,
  LevelRules,
  WinCondition,
} from "@bobby/model";

export { World, type WorldOptions, type WorldSnapshot } from "./world/World.js";
export type {
  CellInspection,
  MoveResult,
  PassageInfo,
  PresenceInspection,
  WorldEvent,
} from "./world/WorldTypes.js";
export type {
  GlobalState,
  InventoryState,
  ProfileCapabilities,
} from "./world/GlobalState.js";
export { EntityRegistry } from "./world/entity/EntityRegistry.js";
export type {
  AudioProfileId,
  BehaviorId,
  EntityAuthoringDefinition,
  EntityDefinition,
  EntityFieldDefinition,
  EntityFieldKind,
  EntityFieldOption,
  EntityPresentationDefinition,
  EntityTrait,
  OccupancyDefinition,
  VisualId,
} from "./world/entity/EntityDefinition.js";
export type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "./world/entity/EntityInstance.js";
export { EntityStore } from "./world/entity/EntityStore.js";
export type { EntityStoreSnapshot } from "./world/entity/EntityStore.js";
export type { EntityPresence } from "./world/spatial/EntityPresence.js";
export {
  footprintCell,
  footprintOffset,
  resolveFootprintCells,
  SINGLE_CELL_FOOTPRINT,
} from "./world/spatial/Footprint.js";
export type {
  FootprintDefinition,
  FootprintEntity,
  FootprintPart,
  ResolvedFootprintCell,
} from "./world/spatial/Footprint.js";
export { STACK_BANDS } from "./world/spatial/StackBand.js";
export type { StackBand } from "./world/spatial/StackBand.js";
export { SpatialIndex } from "./world/spatial/SpatialIndex.js";
export { WorldPreview } from "./world/WorldPreview.js";
export { BehaviorRegistry } from "./world/behavior/BehaviorRegistry.js";
export { CommandQueue } from "./world/behavior/CommandQueue.js";
export { WorldQueryApi } from "./world/behavior/WorldQueryApi.js";
export type {
  Behavior,
  BehaviorContext,
  BehaviorSubject,
  PassageResult,
} from "./world/behavior/Behavior.js";
export {
  behaviorRegistry,
  createBuiltinBehaviorRegistry,
} from "./entities/behaviors.js";
export type { EntityModule } from "./entities/EntityModule.js";
export {
  builtinEntityDefinitions,
  builtinEntityModules,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
  entityRegistry,
  visualRegistry,
} from "./entities/registry.js";

export {
  VisualRegistry,
  deterministicVisualVariantIndex,
  stableVisualHash,
} from "./visual/VisualRegistry.js";
export { SpatialVisualQuery } from "./visual/SpatialVisualQuery.js";
export {
  CARDINAL_CONNECTION,
  cardinalConnectionMask,
  resolveCardinalTopology,
} from "./visual/AutoConnect.js";
export type {
  AutoConnectPredicate,
  AutoConnectShape,
  AutoConnectTopology,
  CardinalConnectionMask,
} from "./visual/AutoConnect.js";
export {
  resolveEntityVisualPreview,
  type EntityVisualPreviewSource,
} from "./visual/preview.js";
export type {
  AtlasVisualLayer,
  CanvasVisualLayer,
  EntityVisualRuntimeState,
  ImageVisualLayer,
  PersistedVisualVariantDefinition,
  QuarterTurn,
  VisualAssetSources,
  VisualAuthoringDefinition,
  VisualComposition,
  VisualDefinition,
  VisualLayer,
  VisualQuery,
  VisualResolveContext,
} from "./visual/VisualDefinition.js";
