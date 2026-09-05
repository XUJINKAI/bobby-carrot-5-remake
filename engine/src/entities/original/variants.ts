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

export const originalVariantModules: readonly EntityModule[] = [
  ...backgroundVariants,
  ...walkableVariants,
  ...objectVariants,
];
