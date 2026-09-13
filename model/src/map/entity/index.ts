export { MapEntityTypeId } from "./ids.js";
export type {
  NamedMapEntityType,
  MapEntityType,
} from "./ids.js";

export {
  LEVEL_ENTITY_RESERVED_FIELDS,
  defineEntity,
  booleanField,
  stringField,
  stringOrStringListField,
  integerField,
  enumField,
  isLevelEntityReservedField,
} from "./contract.js";
export type {
  LevelEntityReservedField,
  EntityStringFormat,
  EntityMapFieldDefinition,
  EntityMapDefinition,
} from "./contract.js";

export {
  SURFACE_ENTITY_DEFINITIONS,
  SURFACE_SOURCE_MAPPINGS,
  surfaceMappingForTs,
  surfaceMappingForEntity,
  tsLabel,
  tsVariant,
} from "./surface.js";
export type { TsCoordinate, SurfaceSourceMapping } from "./surface.js";

export {
  ORIGINAL_TILE_ATLASES,
  ORIGINAL_TILE_VISUAL_GROUPS,
  ORIGINAL_TILE_VISUALS,
  ORIGINAL_TILE_ANIMATIONS,
  originalTileVisualGroup,
  originalTileVisualGroups,
  originalTileVisual,
  originalTileAnimation,
  originalTileAtlasCell,
  originalTileCoordinateLabel,
  parseOriginalTileCoordinateLabel,
  isOriginalTileCoordinate,
} from "./original-tile-visual-catalog.js";
export type {
  OriginalTilePanel,
  OriginalTileAtlasId,
  OriginalTileCoordinate,
  OriginalTileSource,
  OriginalTileAtlasDefinition,
  OriginalTileVisualDefinition,
  OriginalTileAnimationDefinition,
  OriginalTileVisualGroupDefinition,
  OriginalTileVisualSelector,
  OriginalTileAnimationSelector,
} from "./original-tile-visual-catalog.js";

export {
  ENTITY_MAP_DEFINITIONS,
  entityMapDefinition,
  requireEntityMapDefinition,
  entityMapFields,
} from "./catalog.js";
