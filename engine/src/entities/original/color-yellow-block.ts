import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  cell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.COLOR_YELLOW_BLOCK,
  traits: ["stateful-block", "walkable"],
  stackOrder: SURFACE_STACK_ORDER,
  state: [
    {
      key: "raised",
      kind: "boolean",
      label: "升起",
      default: true,
    },
  ],
  presentation: { name: "Yellow Block", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const colorYellowBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.raised === false ? cell(4, 12) : cell(3, 12),
  ),
);
