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
  type: EntityTypeId.MIRROR,
  traits: ["walkable", "mirror", "rotatable"],
  stackOrder: SURFACE_STACK_ORDER,
  state: variantState([1, 2, 3, 4]),
  presentation: { name: "Mirror", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const mirror: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    cell(boundedInt(context.entity.state?.variant, 1, 4, 1), 11),
  ),
);
