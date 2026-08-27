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
export type {
  FootprintDefinition,
  FootprintPart,
} from "./world/spatial/Footprint.js";
export { STACK_BANDS } from "./world/spatial/StackBand.js";
export type { StackBand } from "./world/spatial/StackBand.js";
export { SpatialIndex } from "./world/spatial/SpatialIndex.js";
export { WorldPreview } from "./world/WorldPreview.js";
export type {
  CellInspection,
  PresenceInspection,
} from "./world/WorldPreview.js";
export {
  builtinEntityDefinitions,
  createBuiltinEntityRegistry,
  entityRegistry,
} from "./entities/registry.js";

export { VisualRegistry } from "./visual/VisualRegistry.js";
export {
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
  createBuiltinVisualRegistry,
  visualRegistry,
} from "./visual/builtin.js";
export type {
  AtlasVisualLayer,
  CustomVisualLayer,
  PersistedVisualVariantDefinition,
  QuarterTurn,
  VisualAuthoringDefinition,
  VisualComposition,
  VisualDefinition,
  VisualLayer,
  VisualQuery,
  VisualResolveContext,
} from "./visual/VisualDefinition.js";

/** Transitional atlas source used by the built-in Visual Definitions. */
export {
  entityAtlasCell,
  drawEntityTile,
} from "./render/entity-art.js";
export type { AtlasCell } from "./render/entity-art.js";
