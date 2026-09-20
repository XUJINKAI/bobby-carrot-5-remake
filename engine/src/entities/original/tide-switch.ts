import { MapEntityTypeId } from "@bobby/model";
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
import { directionalSwitchBehavior } from "./directional-switch.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.TIDE_SWITCH,
  presenceFacts: ["walkable"],
  state: pressedState,
  presentation: { name: "Tide Switch" },
};

const tideSwitchBehavior = directionalSwitchBehavior(
  "tide-switch-global-reverse",
  MapEntityTypeId.TIDE_SWITCH,
  MapEntityTypeId.TIDE,
);

export const tideSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.TIDE_SWITCH, {
      fields: { pressed: context.entity.state?.pressed === true },
    }),
  ),
  [{ behavior: tideSwitchBehavior }],
);
