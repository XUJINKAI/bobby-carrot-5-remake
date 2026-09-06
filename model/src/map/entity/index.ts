export { EntityTypeId } from "./implementation-ids.js";
export { MapEntityTypeId } from "./ids.js";
export type {
  NamedMapEntityType,
  CoordinateSurfaceEntityType,
  MapEntityType,
} from "./ids.js";

export {
  LEVEL_ENTITY_RESERVED_FIELDS,
  defineEntity,
  booleanField,
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
  coordinateSurfaceType,
  coordinateSurfaceDefinition,
  tsLabel,
  tsVariant,
} from "./surface.js";
export type { TsCoordinate, SurfaceSourceMapping } from "./surface.js";

export {
  ENTITY_MAP_DEFINITIONS,
  entityMapDefinition,
  requireEntityMapDefinition,
  entityMapFields,
} from "./catalog.js";

export {
  ENTITY_MAP_MIGRATION_ALIASES,
  ENTITY_MAP_UNRESOLVED_SOURCES,
  legacyEntityMapAlias,
} from "./migration.js";
export type {
  EntityMapMigrationAlias,
  UnresolvedEntityMapSource,
} from "./migration.js";
