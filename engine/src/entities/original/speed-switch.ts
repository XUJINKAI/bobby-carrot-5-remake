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
import { createDirectionalSwitchBehavior } from "../behaviors/directional-switch.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.SPEED_SWITCH,
  presenceFacts: ["walkable"],
  state: pressedState,
  presentation: { name: "Speed Switch" },
};

const speedSwitchBehavior = createDirectionalSwitchBehavior(
  "speed-switch-global-reverse",
  MapEntityTypeId.SPEED_SWITCH,
  MapEntityTypeId.SPEED,
);

export const speedSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.SPEED_SWITCH, {
      fields: { pressed: context.entity.state?.pressed === true },
    }),
  ),
  [{ behavior: speedSwitchBehavior }],
);
