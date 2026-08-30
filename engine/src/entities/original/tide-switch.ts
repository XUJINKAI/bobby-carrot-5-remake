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
  type: EntityTypeId.TIDE_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  state: pressedState,
  presentation: { name: "Tide Switch", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const tideSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(6, 10) : cell(5, 10),
  ),
);
