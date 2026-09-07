import type { JsonPrimitive } from "../../shared/json.js";
import { defineEntity, enumField, type EntityMapDefinition } from "./contract.js";
import { MapEntityTypeId, type MapEntityType } from "./ids.js";
import {
  TS_SURFACE_FAMILIES,
  parseTsCoordinateLabel,
  tsCoordinateLabel,
  type TsCoordinate,
} from "./ts-visual-catalog.js";

export type { TsCoordinate } from "./ts-visual-catalog.js";

export interface SurfaceSourceMapping {
  source: TsCoordinate;
  type: MapEntityType;
  fields?: Readonly<Record<string, JsonPrimitive>>;
}

export const SURFACE_SOURCE_MAPPINGS: readonly SurfaceSourceMapping[] =
  Object.freeze(TS_SURFACE_FAMILIES.flatMap((family) =>
    family.cells.map((cell) => Object.freeze({
      source: { row: cell.row, column: cell.column },
      type: family.type as MapEntityType,
      ...(family.coordinateVariant
        ? { fields: Object.freeze({ variant: tsVariant(cell) }) }
        : cell.fields
          ? { fields: cell.fields }
          : {}),
    })),
  ));

const allTsVariants = Array.from({ length: 256 }, (_, index) =>
  tsCoordinateLabel({
    row: Math.floor(index / 16) + 1,
    column: (index % 16) + 1,
  }),
);

export const SURFACE_ENTITY_DEFINITIONS: readonly EntityMapDefinition[] = Object.freeze([
  defineEntity(
    MapEntityTypeId.SURFACE,
    [enumField("variant", allTsVariants, undefined, true)],
    "尚未确定语义名称的 ts.png 单格 Surface。",
  ),
  defineEntity(MapEntityTypeId.WATER),
  defineEntity(MapEntityTypeId.WATER_RIPPLE, [], "带波纹动画的水面。"),
  defineEntity(MapEntityTypeId.WATERFALL, [
    enumField("variant", ["top", "middle", "bottom"], undefined, true),
  ]),
  defineEntity(MapEntityTypeId.STARFIELD, [
    enumField("variant", ["large-star", "small-star", "empty"], undefined, true),
  ]),
  coordinateVariantDefinition(MapEntityTypeId.MOON),
  coordinateVariantDefinition(MapEntityTypeId.CLOUD_LAYER),
  coordinateVariantDefinition(MapEntityTypeId.GRASS),
  coordinateVariantDefinition(MapEntityTypeId.HEDGE),
  coordinateVariantDefinition(MapEntityTypeId.TREE),
  coordinateVariantDefinition(MapEntityTypeId.STONE_WALL_1),
  coordinateVariantDefinition(MapEntityTypeId.STONE_WALL_2),
  defineEntity(MapEntityTypeId.STUMP),
  defineEntity(MapEntityTypeId.FLOWER_POT),
  defineEntity(MapEntityTypeId.ROCK),
  defineEntity(MapEntityTypeId.MUSHROOM),
  coordinateVariantDefinition(MapEntityTypeId.SNOWMAN),
  coordinateVariantDefinition(MapEntityTypeId.CANDY_CANE),
  coordinateVariantDefinition(MapEntityTypeId.CHRISTMAS_TREE),
  coordinateVariantDefinition(MapEntityTypeId.SNOW_FENCE),
  defineEntity(MapEntityTypeId.SNOWY_ROCK),
  coordinateVariantDefinition(MapEntityTypeId.SNOW_GROUND),
  defineEntity(MapEntityTypeId.CACTUS, [
    enumField("variant", ["small", "round"], undefined, true),
  ]),
  coordinateVariantDefinition(MapEntityTypeId.TALL_CACTUS),
  defineEntity(MapEntityTypeId.SAND),
  defineEntity(MapEntityTypeId.CLOUD_PARKING, [
    enumField("color", ["red", "purple", "green"], undefined, true),
  ]),
]);

export function surfaceMappingForTs(
  row: number,
  column: number,
): SurfaceSourceMapping | undefined {
  return SURFACE_SOURCE_MAPPINGS.find((mapping) =>
    mapping.source.row === row && mapping.source.column === column
  );
}

export function surfaceMappingForEntity(
  type: string,
  fields: Readonly<Record<string, unknown>>,
): SurfaceSourceMapping | undefined {
  if (type === MapEntityTypeId.SURFACE) {
    const coordinate = typeof fields.variant === "string"
      ? parseTsCoordinateLabel(fields.variant)
      : undefined;
    return coordinate
      ? {
          type: MapEntityTypeId.SURFACE,
          source: coordinate,
          fields: { variant: fields.variant as string },
        }
      : undefined;
  }
  return SURFACE_SOURCE_MAPPINGS.find((mapping) =>
    mapping.type === type &&
    Object.entries(mapping.fields ?? {}).every(([key, value]) => fields[key] === value)
  );
}

export function tsLabel(source: TsCoordinate): string {
  return `ts(${source.row},${source.column})`;
}

export function tsVariant(source: TsCoordinate): string {
  return tsCoordinateLabel(source);
}

function coordinateVariantDefinition(type: MapEntityType): EntityMapDefinition {
  const values = SURFACE_SOURCE_MAPPINGS
    .filter((mapping) => mapping.type === type)
    .map((mapping) => mapping.fields?.variant)
    .filter((value): value is string => typeof value === "string");
  return defineEntity(type, [enumField("variant", values, undefined, true)]);
}
