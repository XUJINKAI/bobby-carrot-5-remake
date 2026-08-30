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
  type: EntityTypeId.COLOR_PINK_BLOCK,
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
  presentation: { name: "Pink Block" },
};

export const colorPinkBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.raised === false ? cell(6, 12) : cell(5, 12),
  ),
);
