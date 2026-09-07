import { MapEntityTypeId } from "@bobby/model";
import { colorSwitchBehavior } from "./switch-runtime.js";
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
  type: MapEntityTypeId.COLOR_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  state: [
    {
      key: "color",
      kind: "enum",
      label: "颜色",
      default: "yellow",
      options: [{ value: "yellow" }, { value: "pink" }],
    },
    ...pressedState,
  ],
  presentation: { name: "Color Switch" },
};

export const colorSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const pressed = context.entity.state?.pressed === true;
    return context.entity.state?.color === "pink"
      ? pressed
        ? cell(2, 12)
        : cell(1, 12)
      : pressed
        ? cell(0, 12)
        : cell(15, 11);
  }),
  [{ behavior: colorSwitchBehavior }],
);
