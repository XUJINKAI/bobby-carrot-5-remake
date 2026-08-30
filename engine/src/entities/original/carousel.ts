import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  cell,
  originalModule,
  SURFACE_STACK_ORDER,
  variantState,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.CAROUSEL,
  traits: ["walkable", "carousel", "directional-passage", "rotatable"],
  stackOrder: SURFACE_STACK_ORDER,
  state: variantState([1, 2, 3, 4, "vertical", "horizontal"]),
  presentation: { name: "Carousel", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const carousel: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const variant = context.entity.state?.variant ?? 1;
    if (variant === "vertical") return cell(13, 11);
    if (variant === "horizontal") return cell(14, 11);
    return cell(8 + boundedInt(variant, 1, 4, 1), 11);
  }),
);
