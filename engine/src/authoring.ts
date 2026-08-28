export { EntityRegistry } from "./world/entity/EntityRegistry.js";
export type {
  BehaviorId,
  EntityDefinition,
  EntityFieldDefinition,
  EntityFieldKind,
  EntityFieldOption,
  EntityTrait,
  OccupancyDefinition,
  VisualId,
  AudioProfileId,
} from "./world/entity/EntityDefinition.js";
export { EntityStore } from "./world/entity/EntityStore.js";
export type { EntityStoreSnapshot } from "./world/entity/EntityStore.js";
export type { CellPosition, EntityId, EntityInstance } from "./world/entity/EntityInstance.js";
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
export {
  ImageManager,
  type ImageManagerOptions,
  type ImageSliceDefinition,
  type LoadedImageSlice,
} from "./image/ImageManager.js";
export {
  defineEntityModule,
  type EntityAuthoringDefinition,
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
  EntityVisualRuntimeState,
  ImageVisualLayer,
  VisualComposition,
  VisualDefinition,
  VisualLayer,
  VisualQuery,
  VisualResolveContext,
} from "./visual/VisualDefinition.js";
