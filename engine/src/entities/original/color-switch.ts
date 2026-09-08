import { MapEntityTypeId } from "@bobby/model";
import { colorSwitchBehavior } from "./switch-runtime.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
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
    {
      key: "state",
      kind: "enum",
      label: "状态",
      default: "state-1",
      options: [{ value: "state-1" }, { value: "state-2" }],
    },
  ],
  presentation: { name: "Color Switch" },
};

export const colorSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const color = context.entity.state?.color === "pink" ? "pink" : "yellow";
    const state = context.entity.state?.state === "state-2"
      ? "state-2"
      : "state-1";
    return tileCell(MapEntityTypeId.COLOR_SWITCH, {
      fields: { color, state },
    });
  }),
  [{ behavior: colorSwitchBehavior }],
);
