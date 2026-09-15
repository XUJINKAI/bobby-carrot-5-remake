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
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.CAROUSEL_SWITCH,
  presenceFacts: ["walkable"],
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
