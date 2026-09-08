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
import { sharedOriginalSurfaceTraits } from "./surface-traits.js";

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
  authoring: { palette: false },
  traits: [],
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
  ...[...semanticSurfaceGroups.entries()].map(([type, mappings]) =>
    canonicalSurface(type, mappings)
  ),
];

function canonicalSurface(
  type: string,
  mappings: readonly SurfaceSourceMapping[],
): EntityModule {
  const definition: EntityModuleDefinition = {
    type,
    authoring: { palette: false },
    traits: sharedOriginalSurfaceTraits(mappings),
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
