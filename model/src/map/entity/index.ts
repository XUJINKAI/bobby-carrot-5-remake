export { EntityTypeId } from "./implementation-ids.js";
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
  integerField,
  enumField,
  isLevelEntityReservedField,
} from "./contract.js";
export type {
  LevelEntityReservedField,
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
  TS_SURFACE_FAMILIES,
  TS_UNIDENTIFIED_CELLS,
  TS_VISUALS,
  tsVisual,
  tsAtlasCell,
  tsCoordinateLabel,
  parseTsCoordinateLabel,
} from "./ts-visual-catalog.js";
export type {
  TsVisualDefinition,
  TsSurfaceFamilyDefinition,
  TsAtlasCellDefinition,
} from "./ts-visual-catalog.js";

export {
  ENTITY_MAP_DEFINITIONS,
  entityMapDefinition,
  requireEntityMapDefinition,
  entityMapFields,
} from "./catalog.js";
