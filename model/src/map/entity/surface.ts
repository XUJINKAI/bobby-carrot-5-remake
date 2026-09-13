import type { JsonPrimitive } from "../../shared/json.js";
import {
  defineEntity,
  enumField,
  stringOrStringListField,
  type EntityMapDefinition,
} from "./contract.js";
import { MapEntityTypeId, type MapEntityType } from "./ids.js";
import {
  originalTileCoordinateLabel,
  originalTileVisualGroups,
  parseOriginalTileCoordinateLabel,
  type OriginalTileCoordinate,
} from "./original-tile-visual-catalog.js";

export type TsCoordinate = OriginalTileCoordinate;

export interface SurfaceSourceMapping {
  source: TsCoordinate;
  type: MapEntityType;
  fields?: Readonly<Record<string, JsonPrimitive>>;
}

const surfaceGroups = originalTileVisualGroups("surface");

export const SURFACE_SOURCE_MAPPINGS: readonly SurfaceSourceMapping[] = Object.freeze(
  surfaceGroups.flatMap((group) => group.visuals.map((visual) => Object.freeze({
    source: { row: visual.row, column: visual.column },
    type: group.type as MapEntityType,
    ...(Object.keys(visual.fields).length > 0 ? { fields: visual.fields } : {}),
  }))),
);

export const SURFACE_ENTITY_DEFINITIONS: readonly EntityMapDefinition[] = Object.freeze(
  surfaceGroups.map((group) => {
    const variants = group.visuals
      .map((visual) => visual.fields.variant)
      .filter((value): value is JsonPrimitive => value !== undefined);
    return defineEntity(
      group.type as MapEntityType,
      [
        ...(variants.length > 0
          ? [enumField(
              "variant",
              variants,
              group.type === MapEntityTypeId.FENCE ? undefined : variants[0],
              group.type !== MapEntityTypeId.FENCE,
            )]
          : []),
        ...(group.type === MapEntityTypeId.SNOWMAN
          ? [stringOrStringListField(
              "dialogue",
              false,
              "触碰雪人时显示的字面对白；数组按图块独立循环。",
            )]
          : []),
      ],
    );
  }),
);

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
  return SURFACE_SOURCE_MAPPINGS.find((mapping) =>
    mapping.type === type &&
    Object.entries(mapping.fields ?? {}).every(([key, value]) => fields[key] === value)
  );
}

export function tsLabel(source: TsCoordinate): string {
  return `ts(${source.row},${source.column})`;
}

export function tsVariant(source: TsCoordinate): string {
  return originalTileCoordinateLabel(source);
}
