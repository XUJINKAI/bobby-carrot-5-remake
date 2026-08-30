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
  type: EntityTypeId.COLOR_YELLOW_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  state: pressedState,
  presentation: { name: "Yellow Switch", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const colorYellowSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(0, 12) : cell(15, 11),
  ),
);
