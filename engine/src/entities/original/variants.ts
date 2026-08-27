import type { EntityModule } from "../EntityModule.js";
import { cell, staticContent, staticSurface } from "./module.js";

const backgroundVariants = Array.from({ length: 256 }, (_, index) => {
  const number = index + 1;
  return staticSurface(
    `background-variant-${String(number).padStart(3, "0")}`,
    `Background Variant ${number}`,
    cell(index % 16, Math.floor(index / 16)),
    [],
    {
      presentation: {
        name: `Background Variant ${number}`,
        category: "原版背景",
      },
      authoring: { palette: false, category: "原版背景" },
    },
  );
});

const walkableVariants = Array.from({ length: 52 }, (_, index) => {
  const number = index + 1;
  const linear = 6 * 16 + index;
  return staticSurface(
    `walkable-variant-${String(number).padStart(2, "0")}`,
    `Walkable Variant ${number}`,
    cell(linear % 16, Math.floor(linear / 16)),
    ["walkable"],
    {
      presentation: {
        name: `Walkable Variant ${number}`,
        category: "原版地表",
      },
      authoring: { palette: false, category: "原版地表" },
    },
  );
});

const objectVariants = Array.from({ length: 256 }, (_, index) => {
  const number = index + 1;
  return staticContent(
    `object-variant-${String(number).padStart(3, "0")}`,
    `Object Variant ${number}`,
    cell(index % 16, Math.floor(index / 16)),
    [],
    {
      presentation: {
        name: `Object Variant ${number}`,
        category: "原版实体",
      },
      authoring: { palette: false, category: "原版实体" },
    },
  );
});

export const originalVariantModules: readonly EntityModule[] = [
  ...backgroundVariants,
  ...walkableVariants,
  ...objectVariants,
];
