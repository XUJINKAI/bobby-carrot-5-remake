import { MapEntityTypeId } from "@bobby/model";
import { tideSwitchBehavior } from "./switch-runtime.js";
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
  type: MapEntityTypeId.TIDE_SWITCH,
  facts: ["walkable"],
  state: pressedState,
  presentation: { name: "Tide Switch" },
};

export const tideSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.TIDE_SWITCH, {
      fields: { pressed: context.entity.state?.pressed === true },
    }),
  ),
  [{ behavior: tideSwitchBehavior }],
);
