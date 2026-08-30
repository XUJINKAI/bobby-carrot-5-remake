import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  cell,
  CONTENT_STACK_ORDER,
  staticEntity,
  SURFACE_STACK_ORDER,
} from "./module.js";

const backgroundVariants = Array.from({ length: 256 }, (_, index) => {
  const number = index + 1;
  const definition: EntityModuleDefinition = {
    type: `background-variant-${String(number).padStart(3, "0")}`,
    traits: [],
    stackOrder: SURFACE_STACK_ORDER,
    presentation: {
      name: `Background Variant ${number}`,
      category: "原版背景",
    },
    authoring: {
      palette: false,
      category: "原版背景",
      replaceGroup: "surface",
    },
  };
  return staticEntity(definition, cell(index % 16, Math.floor(index / 16)));
});

const walkableVariants = Array.from({ length: 52 }, (_, index) => {
  const number = index + 1;
  const linear = 6 * 16 + index;
  const definition: EntityModuleDefinition = {
    type: `walkable-variant-${String(number).padStart(2, "0")}`,
    traits: ["walkable"],
    stackOrder: SURFACE_STACK_ORDER,
    presentation: {
      name: `Walkable Variant ${number}`,
      category: "原版地表",
    },
    authoring: {
      palette: false,
      category: "原版地表",
      replaceGroup: "surface",
    },
  };
  return staticEntity(definition, cell(linear % 16, Math.floor(linear / 16)));
});

const objectVariants = Array.from({ length: 256 }, (_, index) => {
  const number = index + 1;
  const definition: EntityModuleDefinition = {
    type: `object-variant-${String(number).padStart(3, "0")}`,
    traits: [],
    stackOrder: CONTENT_STACK_ORDER,
    presentation: {
      name: `Object Variant ${number}`,
      category: "原版实体",
    },
    authoring: { palette: false, category: "原版实体" },
  };
  return staticEntity(definition, cell(index % 16, Math.floor(index / 16)));
});

export const originalVariantModules: readonly EntityModule[] = [
  ...backgroundVariants,
  ...walkableVariants,
  ...objectVariants,
];
