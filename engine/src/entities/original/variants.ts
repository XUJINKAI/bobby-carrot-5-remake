import {
  MapEntityTypeId,
  SURFACE_SOURCE_MAPPINGS,
  parseTsCoordinateLabel,
  type SurfaceSourceMapping,
} from "@bobby/model";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import {
  atlasVisual,
  originalModule,
  SURFACE_STACK_ORDER,
  tsCoordinateCell,
} from "./module.js";

const semanticSurfaceGroups = new Map<string, SurfaceSourceMapping[]>();
for (const mapping of SURFACE_SOURCE_MAPPINGS) {
  if (
    mapping.type === MapEntityTypeId.FENCE ||
    mapping.type === MapEntityTypeId.SURFACE
  ) continue;
  const group = semanticSurfaceGroups.get(mapping.type) ?? [];
  group.push(mapping);
  semanticSurfaceGroups.set(mapping.type, group);
}

const genericSurfaceDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.SURFACE,
  authoring: { palette: false },
  traits: [],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  state: [{ key: "variant", kind: "string", label: "Visual variant" }],
  presentation: { name: "Surface" },
};

const genericSurface = originalModule(
  genericSurfaceDefinition,
  atlasVisual(genericSurfaceDefinition, (context) => {
    const coordinate = typeof context.entity.state?.variant === "string"
      ? parseTsCoordinateLabel(context.entity.state.variant)
      : undefined;
    return coordinate ? tsCoordinateCell(coordinate) : null;
  }),
);

export const originalVariantModules: readonly EntityModule[] = [
  genericSurface,
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
    traits: canonicalSurfaceTraits(mappings),
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

function canonicalSurfaceTraits(
  mappings: readonly SurfaceSourceMapping[],
): string[] {
  const numbers = mappings.map(
    ({ source }) => (source.row - 1) * 16 + source.column,
  );
  const traits = new Set<string>();
  if (numbers.some((number) => number >= 97 && number <= 148))
    traits.add("walkable");
  if (numbers.some((number) => number <= 94))
    traits.add("bean-growth-space");
  if (numbers.some((number) => number >= 72 && number <= 77))
    traits.add("cloud-space");
  if (
    mappings.some((mapping) =>
      mapping.type === MapEntityTypeId.WATER ||
      mapping.type === MapEntityTypeId.WATER_RIPPLE ||
      mapping.type === MapEntityTypeId.WATERFALL
    )
  ) {
    traits.add("water");
    traits.add("bean-growth-space");
  }
  if (mappings.some((mapping) => mapping.type === MapEntityTypeId.WATERFALL))
    traits.add("waterfall");
  return [...traits];
}
