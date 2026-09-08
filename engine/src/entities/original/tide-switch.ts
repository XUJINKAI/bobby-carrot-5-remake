import { EntityTypeId } from "@bobby/model";
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
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.TIDE_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  state: pressedState,
  presentation: { name: "Tide Switch" },
};

export const tideSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(EntityTypeId.TIDE_SWITCH, {
      fields: { pressed: context.entity.state?.pressed === true },
    }),
  ),
  [{ behavior: tideSwitchBehavior }],
);
