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
export { STACK_BANDS } from "./world/spatial/StackBand.js";
export type { StackBand } from "./world/spatial/StackBand.js";
export { SpatialIndex } from "./world/spatial/SpatialIndex.js";
export { WorldPreview } from "./world/WorldPreview.js";
export {
  defineEntityModule,
  type EntityBehaviorBinding,
  type EntityModule,
} from "./entities/EntityModule.js";
export {
  builtinEntityDefinitions,
  builtinEntityModules,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
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
  EntityVisualRuntimeState,
  ImageVisualLayer,
  VisualAssetSources,
  VisualComposition,
  VisualDefinition,
  VisualLayer,
  VisualQuery,
  VisualResolveContext,
} from "./visual/VisualDefinition.js";
