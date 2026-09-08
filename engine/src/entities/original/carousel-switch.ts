import { MapEntityTypeId } from "@bobby/model";
import { carouselSwitchBehavior } from "./switch-runtime.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
  pressedState,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.CAROUSEL_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  state: pressedState,
  presentation: { name: "Carousel Switch" },
};

export const carouselSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.CAROUSEL_SWITCH, {
      fields: { pressed: context.entity.state?.pressed === true },
    }),
  ),
  [{ behavior: carouselSwitchBehavior }],
);
