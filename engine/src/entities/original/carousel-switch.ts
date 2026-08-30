import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  cell,
  originalModule,
  pressedState,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.CAROUSEL_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  state: pressedState,
  presentation: { name: "Carousel Switch", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const carouselSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(4, 10) : cell(3, 10),
  ),
);
