import {
  MapEntityTypeId,
  SURFACE_SOURCE_MAPPINGS,
  parseOriginalTileCoordinateLabel,
  type SurfaceSourceMapping,
} from "@bobby/model";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import {
  atlasVisual,
  originalModule,
  SURFACE_STACK_ORDER,
  tsCoordinateCell,
} from "./module.js";
import { sharedOriginalSurfaceFacts } from "./surface-facts.js";

const semanticSurfaceGroups = new Map<string, SurfaceSourceMapping[]>();
for (const mapping of SURFACE_SOURCE_MAPPINGS) {
  if (
    mapping.type === MapEntityTypeId.FENCE ||
    mapping.type === MapEntityTypeId.ICE ||
    mapping.type === MapEntityTypeId.CLOUD_PARKING
  ) continue;
  const group = semanticSurfaceGroups.get(mapping.type) ?? [];
  group.push(mapping);
  semanticSurfaceGroups.set(mapping.type, group);
}

const originalTileDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.ORIGINAL_TILE,
  facts: [],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  state: [{ key: "variant", kind: "string", label: "Original Tile" }],
  presentation: { name: "Original Tile" },
};

const originalTile = originalModule(
  originalTileDefinition,
  atlasVisual(originalTileDefinition, (context) => {
    const coordinate = typeof context.entity.state?.variant === "string"
      ? parseOriginalTileCoordinateLabel(context.entity.state.variant)
      : undefined;
    return coordinate ? tsCoordinateCell(coordinate) : null;
  }),
);

export const originalVariantModules: readonly EntityModule[] = [
  originalTile,
  ...[...semanticSurfaceGroups.entries()]
    .filter(([type]) =>
      type !== MapEntityTypeId.WATER &&
      type !== MapEntityTypeId.WATERFALL &&
      type !== MapEntityTypeId.SNOWMAN
    )
    .map(([type, mappings]) => canonicalSurface(type, mappings)),
  canonicalSurface(MapEntityTypeId.WATER, surfaceMappings(MapEntityTypeId.WATER), [
    "water-overlay",
  ]),
  canonicalSurface(
    MapEntityTypeId.WATERFALL,
    surfaceMappings(MapEntityTypeId.WATERFALL),
    ["water-overlay"],
  ),
  canonicalSurface(MapEntityTypeId.SNOWMAN, surfaceMappings(MapEntityTypeId.SNOWMAN), [
    "dialog",
  ]),
];

function surfaceMappings(type: string): readonly SurfaceSourceMapping[] {
  const mappings = semanticSurfaceGroups.get(type);
  if (!mappings) throw new Error(`缺少 Surface mapping：${type}`);
  return mappings;
}

function canonicalSurface(
  type: string,
  mappings: readonly SurfaceSourceMapping[],
  mechanisms: readonly string[] = [],
): EntityModule {
  const definition: EntityModuleDefinition = {
    type,
    facts: sharedOriginalSurfaceFacts(mappings),
    mechanisms,
    layer: "surface",
    stackOrder: SURFACE_STACK_ORDER,
    presentation: { name: type },
  };
  return originalModule(
    definition,
    atlasVisual(definition, (context) => {
      const mapping = mappings.find((candidate) =>
        Object.entries(candidate.fields ?? {}).every(
          ([key, value]) => context.entity.state?.[key] === value,
        )
      ) ?? mappings[0];
      return mapping ? tsCoordinateCell(mapping.source) : null;
    }),
  );
}
