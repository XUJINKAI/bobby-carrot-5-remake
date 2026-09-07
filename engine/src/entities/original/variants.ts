import {
  MapEntityTypeId,
  SURFACE_SOURCE_MAPPINGS,
  coordinateSurfaceType,
  type SurfaceSourceMapping,
} from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  cell,
  CONTENT_STACK_ORDER,
  originalModule,
  staticEntity,
  SURFACE_STACK_ORDER,
} from "./module.js";

const visualVariantState = [
  {
    key: "variant",
    kind: "number",
    label: "Visual variant",
  },
] as const;

const backgroundVariants = Array.from({ length: 256 }, (_, index) => {
  const number = index + 1;
  const definition: EntityModuleDefinition = {
    type: `background-variant-${String(number).padStart(3, "0")}`,
    traits: [
      ...(number <= 94 ? ["bean-growth-space"] : []),
      ...(number >= 72 && number <= 77 ? ["cloud-space"] : []),
    ],
    stackOrder: SURFACE_STACK_ORDER,
    state: visualVariantState,
    presentation: { name: `Background Variant ${number}` },
  };
  return originalModule(
    definition,
    atlasVisual(definition, (context) => tsCell(context.entity.state?.variant, number)),
  );
});

const walkableVariants = Array.from({ length: 52 }, (_, index) => {
  const number = index + 1;
  const absolute = 6 * 16 + number;
  const definition: EntityModuleDefinition = {
    type: `walkable-variant-${String(number).padStart(2, "0")}`,
    traits: ["walkable"],
    stackOrder: SURFACE_STACK_ORDER,
    state: visualVariantState,
    presentation: { name: `Walkable Variant ${number}` },
  };
  return originalModule(
    definition,
    atlasVisual(definition, (context) =>
      tsCell(context.entity.state?.variant, absolute),
    ),
  );
});

const objectVariants = Array.from({ length: 256 }, (_, index) => {
  const number = index + 1;
  const definition: EntityModuleDefinition = {
    type: `object-variant-${String(number).padStart(3, "0")}`,
    traits: [],
    stackOrder: CONTENT_STACK_ORDER,
    presentation: { name: `Object Variant ${number}` },
  };
  return staticEntity(definition, cell(index % 16, Math.floor(index / 16)));
});

function tsCell(value: unknown, fallback: number) {
  const absolute = boundedInt(value as never, 1, 256, fallback);
  const index = absolute - 1;
  return cell(index % 16, Math.floor(index / 16));
}

const semanticSurfaceGroups = new Map<string, SurfaceSourceMapping[]>();
for (const mapping of SURFACE_SOURCE_MAPPINGS) {
  const group = semanticSurfaceGroups.get(mapping.type) ?? [];
  group.push(mapping);
  semanticSurfaceGroups.set(mapping.type, group);
}

/**
 * Stable Map surface identities must be executable directly by Engine.
 * Legacy background/walkable IDs remain registered only while Original adapters
 * and checked-in maps finish migrating.
 */
export const canonicalSurfaceModules: readonly EntityModule[] = [
  ...[...semanticSurfaceGroups.entries()].map(([type, mappings]) =>
    canonicalSurface(type, mappings),
  ),
  ...Array.from({ length: 256 }, (_, index) => {
    const row = Math.floor(index / 16) + 1;
    const column = (index % 16) + 1;
    return canonicalSurface(coordinateSurfaceType(row, column), [
      { type: coordinateSurfaceType(row, column), sources: [{ row, column }] },
    ]);
  }),
];

function canonicalSurface(
  type: string,
  mappings: readonly SurfaceSourceMapping[],
): EntityModule {
  const fixedComposite =
    mappings.length === 1 && mappings[0]!.composite
      ? mappings[0]!
      : undefined;
  const anchor = fixedComposite?.sources[0];
  const definition: EntityModuleDefinition = {
    type,
    traits: canonicalSurfaceTraits(mappings),
    layer: "surface",
    stackOrder: SURFACE_STACK_ORDER,
    ...(fixedComposite && anchor
      ? {
          footprint: {
            parts: fixedComposite.sources.map((source, index) => ({
              dx: source.column - anchor.column,
              dy: source.row - anchor.row,
              role: `source-${index}`,
            })),
          },
        }
      : {}),
    presentation: { name: type },
  };
  return originalModule(
    definition,
    atlasVisual(definition, (context) => {
      const mapping =
        mappings.find((candidate) =>
          Object.entries(candidate.fields ?? {}).every(
            ([key, value]) => context.entity.state?.[key] === value,
          ),
        ) ?? mappings[0];
      if (!mapping) return null;
      const role = context.presence.role;
      const index =
        typeof role === "string" && role.startsWith("source-")
          ? Number(role.slice("source-".length))
          : 0;
      const source = mapping.sources[index] ?? mapping.sources[0];
      return source ? cell(source.column - 1, source.row - 1) : null;
    }),
  );
}

function canonicalSurfaceTraits(
  mappings: readonly SurfaceSourceMapping[],
): string[] {
  const numbers = mappings.flatMap((mapping) =>
    mapping.sources.map(
      (source) => (source.row - 1) * 16 + source.column,
    ),
  );
  const traits = new Set<string>();
  if (numbers.some((number) => number >= 97 && number <= 148))
    traits.add("walkable");
  if (numbers.some((number) => number <= 94))
    traits.add("bean-growth-space");
  if (numbers.some((number) => number >= 72 && number <= 77))
    traits.add("cloud-space");
  if (
    mappings.some(
      (mapping) =>
        mapping.type === MapEntityTypeId.WATER ||
        mapping.type === MapEntityTypeId.WATER_RIPPLE ||
        mapping.type === MapEntityTypeId.WATERFALL,
    )
  ) {
    traits.add("water");
    traits.add("bean-growth-space");
  }
  if (mappings.some((mapping) => mapping.type === MapEntityTypeId.WATERFALL))
    traits.add("waterfall");
  return [...traits];
}

export const originalVariantModules: readonly EntityModule[] = [
  ...canonicalSurfaceModules,
  ...backgroundVariants,
  ...walkableVariants,
  ...objectVariants,
];
