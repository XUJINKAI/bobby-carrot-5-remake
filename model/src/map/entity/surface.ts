import type { JsonPrimitive } from "../../shared/json.js";
import { defineEntity, enumField, integerField, type EntityMapDefinition } from "./contract.js";
import {
  MapEntityTypeId,
  type CoordinateSurfaceEntityType,
  type MapEntityType,
} from "./ids.js";

export interface TsCoordinate {
  row: number;
  column: number;
}

export interface SurfaceSourceMapping {
  sources: readonly TsCoordinate[];
  type: MapEntityType;
  fields?: Readonly<Record<string, JsonPrimitive>>;
  /** Multiple atlas/source tiles form one logical map entity. Adapter must collapse them structurally. */
  composite?: boolean;
  note?: string;
}

const CLOUD_LAYER_COORDS = [
  ...rect(7, 9, 9, 14),
  ...rect(9, 7, 9, 8),
];
const GRASS_COORDS = [
  ...rect(7, 1, 9, 3),
  coord(6, 15),
  coord(6, 16),
  ...rect(7, 4, 9, 6),
  ...rect(7, 7, 8, 8),
  ...rect(10, 1, 10, 4),
];
const HEDGE_COORDS = [
  ...rect(5, 1, 6, 5),
  coord(4, 4),
  coord(4, 5),
  coord(5, 6),
  coord(5, 7),
];
const TREE_COORDS = [...rect(1, 11, 3, 16), coord(4, 11), coord(4, 12)];
const STONE_WALL_1_COORDS = rect(1, 4, 3, 6);
const STONE_WALL_2_COORDS = [...rect(1, 7, 3, 8), ...rect(4, 7, 4, 10)];
const SNOW_GROUND_COORDS = [...rect(7, 15, 8, 16), coord(9, 15)];

/** Named surface families confirmed by docs/system/original/surface.md. */
export const SURFACE_ENTITY_DEFINITIONS: readonly EntityMapDefinition[] = Object.freeze([
  defineEntity(MapEntityTypeId.WATER),
  defineEntity(MapEntityTypeId.WATER_RIPPLE, [], "Water surface with ripple animation; animation frames are presentation-only."),
  defineEntity(MapEntityTypeId.WATERFALL, [
    enumField("variant", ["top", "middle", "bottom"], undefined, true),
  ]),
  defineEntity(MapEntityTypeId.STARFIELD, [
    enumField("variant", ["large-star", "small-star", "empty"], undefined, true),
  ]),
  defineEntity(MapEntityTypeId.MOON, [], "Three source tiles compose one fixed L-shaped moon surface object."),
  defineEntity(MapEntityTypeId.CLOUD_LAYER, [integerField("variant", 1, CLOUD_LAYER_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.GRASS, [integerField("variant", 1, GRASS_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.WOOD_FENCE, [integerField("variant", 1, 6, undefined, true)]),
  defineEntity(MapEntityTypeId.HEDGE, [integerField("variant", 1, HEDGE_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.TREE, [integerField("variant", 1, TREE_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.STONE_WALL_1, [integerField("variant", 1, STONE_WALL_1_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.STONE_WALL_2, [integerField("variant", 1, STONE_WALL_2_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.STUMP),
  defineEntity(MapEntityTypeId.FLOWER_POT),
  defineEntity(MapEntityTypeId.ROCK),
  defineEntity(MapEntityTypeId.MUSHROOM),
  defineEntity(MapEntityTypeId.SNOWMAN, [], "Two source tiles form one fixed vertical object."),
  defineEntity(MapEntityTypeId.CANDY_CANE, [], "Two source tiles form one fixed vertical object."),
  defineEntity(MapEntityTypeId.CHRISTMAS_TREE, [], "Six source tiles form one fixed 2x3 object."),
  defineEntity(MapEntityTypeId.SNOW_FENCE, [integerField("variant", 1, 5, undefined, true)]),
  defineEntity(MapEntityTypeId.SNOWY_ROCK),
  defineEntity(MapEntityTypeId.SNOW_GROUND, [integerField("variant", 1, SNOW_GROUND_COORDS.length, undefined, true)]),
  defineEntity(MapEntityTypeId.CACTUS, [enumField("variant", ["small", "round", "tall"], undefined, true)]),
  defineEntity(MapEntityTypeId.SAND),
  defineEntity(MapEntityTypeId.CLOUD_PARKING, [
    enumField("color", ["red", "purple", "green"], undefined, true),
  ]),
]);

/**
 * First-pass source mapping. Variant numbers are deterministic document-order numbers, not old DAT IDs.
 * This makes every guess directly reviewable against ts(row,column).
 */
export const SURFACE_SOURCE_MAPPINGS: readonly SurfaceSourceMapping[] = Object.freeze([
  single(6, 6, MapEntityTypeId.WATER),
  single(6, 7, MapEntityTypeId.WATER_RIPPLE),
  single(6, 12, MapEntityTypeId.WATERFALL, { variant: "top" }),
  single(6, 13, MapEntityTypeId.WATERFALL, { variant: "middle" }),
  single(6, 14, MapEntityTypeId.WATERFALL, { variant: "bottom" }),

  single(5, 8, MapEntityTypeId.STARFIELD, { variant: "large-star" }),
  single(5, 9, MapEntityTypeId.STARFIELD, { variant: "small-star" }),
  single(5, 10, MapEntityTypeId.STARFIELD, { variant: "empty" }),
  composite([coord(5, 11), coord(5, 12), coord(5, 13)], MapEntityTypeId.MOON, "Fixed three-tile moon composition."),

  ...variantMappings(MapEntityTypeId.CLOUD_LAYER, CLOUD_LAYER_COORDS),
  ...variantMappings(MapEntityTypeId.GRASS, GRASS_COORDS),
  ...variantMappings(MapEntityTypeId.WOOD_FENCE, rect(16, 10, 16, 15)),
  ...variantMappings(MapEntityTypeId.HEDGE, HEDGE_COORDS),
  ...variantMappings(MapEntityTypeId.TREE, TREE_COORDS),
  ...variantMappings(MapEntityTypeId.STONE_WALL_1, STONE_WALL_1_COORDS),
  ...variantMappings(MapEntityTypeId.STONE_WALL_2, STONE_WALL_2_COORDS),

  single(1, 1, MapEntityTypeId.STUMP),
  single(1, 3, MapEntityTypeId.FLOWER_POT),
  single(4, 6, MapEntityTypeId.ROCK),
  single(4, 14, MapEntityTypeId.MUSHROOM),

  composite([coord(3, 3), coord(4, 3)], MapEntityTypeId.SNOWMAN, "Fixed two-tile snowman."),
  composite([coord(3, 2), coord(4, 2)], MapEntityTypeId.CANDY_CANE, "Fixed two-tile candy cane."),
  composite(rect(1, 9, 3, 10), MapEntityTypeId.CHRISTMAS_TREE, "Fixed six-tile Christmas tree."),
  ...variantMappings(MapEntityTypeId.SNOW_FENCE, [coord(2, 1), coord(2, 2), coord(2, 3), coord(3, 1), coord(4, 1)]),
  single(1, 2, MapEntityTypeId.SNOWY_ROCK),
  ...variantMappings(MapEntityTypeId.SNOW_GROUND, SNOW_GROUND_COORDS),

  single(4, 15, MapEntityTypeId.CACTUS, { variant: "small" }),
  single(5, 15, MapEntityTypeId.CACTUS, { variant: "round" }),
  composite([coord(4, 16), coord(5, 16)], MapEntityTypeId.CACTUS, "Tall two-tile cactus.", { variant: "tall" }),
  single(9, 16, MapEntityTypeId.SAND),

  single(16, 1, MapEntityTypeId.CLOUD_PARKING, { color: "red" }),
  single(16, 2, MapEntityTypeId.CLOUD_PARKING, { color: "purple" }),
  single(16, 3, MapEntityTypeId.CLOUD_PARKING, { color: "green" }),
]);

export function surfaceMappingForTs(row: number, column: number): SurfaceSourceMapping | undefined {
  return SURFACE_SOURCE_MAPPINGS.find((mapping) =>
    mapping.sources.some((source) => source.row === row && source.column === column),
  );
}

export function coordinateSurfaceType(row: number, column: number): CoordinateSurfaceEntityType {
  assertTsCoordinate(row, column);
  return `surface-${row}-${column}`;
}

export function coordinateSurfaceDefinition(type: string): EntityMapDefinition | undefined {
  const match = /^surface-(\d+)-(\d+)$/.exec(type);
  if (!match) return undefined;
  const row = Number(match[1]);
  const column = Number(match[2]);
  if (!isTsCoordinate(row, column)) return undefined;
  return defineEntity(type as CoordinateSurfaceEntityType, [], `Unresolved original surface at ts(${row},${column}).`);
}

export function tsLabel(source: TsCoordinate): string {
  return `ts(${source.row},${source.column})`;
}

function single(
  row: number,
  column: number,
  type: MapEntityType,
  fields?: Readonly<Record<string, JsonPrimitive>>,
): SurfaceSourceMapping {
  return Object.freeze({ sources: Object.freeze([coord(row, column)]), type, ...(fields ? { fields: Object.freeze({ ...fields }) } : {}) });
}

function composite(
  sources: readonly TsCoordinate[],
  type: MapEntityType,
  note: string,
  fields?: Readonly<Record<string, JsonPrimitive>>,
): SurfaceSourceMapping {
  return Object.freeze({
    sources: Object.freeze([...sources]),
    type,
    composite: true,
    note,
    ...(fields ? { fields: Object.freeze({ ...fields }) } : {}),
  });
}

function variantMappings(type: MapEntityType, coordinates: readonly TsCoordinate[]): SurfaceSourceMapping[] {
  return coordinates.map((source, index) =>
    Object.freeze({
      sources: Object.freeze([source]),
      type,
      fields: Object.freeze({ variant: index + 1 }),
    }),
  );
}

function coord(row: number, column: number): TsCoordinate {
  assertTsCoordinate(row, column);
  return Object.freeze({ row, column });
}

function rect(startRow: number, startColumn: number, endRow: number, endColumn: number): TsCoordinate[] {
  const result: TsCoordinate[] = [];
  for (let row = startRow; row <= endRow; row += 1)
    for (let column = startColumn; column <= endColumn; column += 1)
      result.push(coord(row, column));
  return result;
}

function assertTsCoordinate(row: number, column: number): void {
  if (!isTsCoordinate(row, column)) throw new Error(`Invalid ts coordinate: ${row},${column}`);
}

function isTsCoordinate(row: number, column: number): boolean {
  return Number.isInteger(row) && Number.isInteger(column) && row >= 1 && row <= 16 && column >= 1 && column <= 16;
}
