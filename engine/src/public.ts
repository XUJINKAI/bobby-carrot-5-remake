export { Game, type GameOptions, type GameRuntimeOptions } from "./core/Game.js";
export type { GameplayActorState, GameplayState } from "./core/GameplayState.js";
export {
  DEFAULT_HISTORY_POLICY,
  shouldCheckpoint,
  type HistoryMode,
  type HistoryPolicy,
} from "./core/HistoryPolicy.js";
export {
  createGameplayRuntime,
  type GameplayRuntime,
  type GameplayRuntimeConfig,
  type CreateGameplayRuntimeOptions,
} from "./core/GameplayRuntime.js";
export {
  DEFAULT_PRESENTATION_HZ,
  DEFAULT_WORLD_HZ,
  resolveEngineTiming,
  type EngineTiming,
  type EngineTimingOptions,
} from "./time/EngineTiming.js";
export {
  ORIGINAL_GAMEPLAY_TIMING,
  resolveGameplayTiming,
  type GameplayMotionTiming,
  type GameplayTiming,
  type GameplayTimingOverride,
} from "./time/GameplayTiming.js";
export {
  PresentationClock,
  type PresentationFrame,
} from "./time/PresentationClock.js";
export {
  WorldClock,
  type WorldTick,
  type WorldTickListener,
} from "./time/WorldClock.js";
export {
  AudioRuntime,
  resolveOriginalMusicUrl,
  type AudioRuntimeOptions,
} from "./audio/AudioRuntime.js";
export {
  NullAudioBackend,
  type AudioBackend,
  type MusicStyle,
} from "./audio/AudioBackend.js";
export {
  ImageManager,
  type ImageManagerOptions,
  type ImageSliceDefinition,
  type LoadedImageSlice,
} from "./image/ImageManager.js";
export {
  prepareCanvas,
  resolveDevicePixelRatio,
  snapRectToDevicePixels,
  snapToDevicePixel,
  type PixelRect,
} from "./render/CanvasPixelGeometry.js";
export { drawVisualComposition } from "./render/VisualPainter.js";
export {
  DEFAULT_INPUT_CONTROLLER_OPTIONS,
  InputController,
  type InputControllerOptions,
  type InputState,
  type LogicalMoveInput,
} from "./input/InputController.js";
export {
  resolveControlInput,
  transformDirection,
  type ControlBinding,
  type ControlTarget,
  type DirectionTransform,
} from "./input/ControlBindings.js";
export {
  DEFAULT_SCREEN_JOYSTICK_OPTIONS,
  ScreenJoystick,
  directionForJoystickVector,
  resolveScreenJoystickLayout,
  type ScreenJoystickLayout,
  type ScreenJoystickOptions,
  type JoystickVectorState,
} from "./input/ScreenJoystick.js";
export { GameplayHud, type GameplayHudOptions } from "./ui/GameplayHud.js";
export {
  GameplayDialog,
  type GameplayDialogOptions,
} from "./ui/GameplayDialog.js";
export type {
  Direction,
  EntityProperties,
  EntityState,
  EntityTraits,
  EntityType,
  JsonValue,
  LevelEntity,
  LevelLimit,
  LevelMap,
  LevelRules,
  WinCondition,
} from "@bobby/model";
export type {
  CellInspection,
  MoveResult,
  PresenceInspection,
  WorldEvent,
} from "./world/WorldTypes.js";
export type {
  MoveCause,
  MoveIntent,
  WorldIntent,
  WorldIntentGroup,
} from "./world/movement/WorldIntent.js";
export type {
  EntityMotion,
  WorldMutationSummary,
  WorldStepResult,
} from "./world/movement/WorldStepResult.js";
export type {
  EconomyState,
  InventoryState,
  ProfileCapabilities,
} from "./world/GlobalState.js";
export {
  createDialogBehavior,
  type DialogInitializer,
} from "./world/dialog/DialogBehavior.js";

export { EntityRegistry } from "./world/entity/EntityRegistry.js";
export type {
  BehaviorId,
  EntityDefinition,
  EntityFieldDefinition,
  EntityFieldKind,
  EntityFieldOption,
  EntityLayer,
  EntityTrait,
  VisualId,
  AudioProfileId,
} from "./world/entity/EntityDefinition.js";
export { EntityStore } from "./world/entity/EntityStore.js";
export type { EntityStoreSnapshot } from "./world/entity/EntityStore.js";
export type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "./world/entity/EntityInstance.js";
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
export { SpatialIndex } from "./world/spatial/SpatialIndex.js";
export {
  defineEntityModule,
  type EntityBehaviorBinding,
  type EntityModule,
  type EntityModuleDefinition,
  type EntityModuleInput,
  type EntityPresentationDefinition,
} from "./entities/EntityModule.js";
export { EntityCatalog } from "./entities/EntityCatalog.js";
export type { EntityCatalogEntry } from "./entities/EntityCatalog.js";
export {
  builtinEntityDefinitions,
  builtinEntityModules,
  createBuiltinEntityCatalog,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
  entityCatalog,
  visualRegistry,
} from "./entities/registry.js";
export { VisualRegistry } from "./visual/VisualRegistry.js";
export { SpatialVisualQuery } from "./visual/SpatialVisualQuery.js";
export {
  resolveEntityVisualPreview,
  type EntityVisualPreviewSource,
} from "./visual/preview.js";
export type {
  AtlasVisualLayer,
  CanvasVisualLayer,
  EntityVisualRuntimeState,
  ImageVisualLayer,
  VisualComposition,
  VisualDefinition,
  VisualLayer,
  VisualQuery,
  VisualRenderPass,
  VisualResolveContext,
} from "./visual/VisualDefinition.js";
