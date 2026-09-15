import { MapEntityTypeId } from "@bobby/model";
import { statefulBlockBehavior } from "../behaviorLibrary.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.COLOR_BLOCK,
  presenceFacts: ["walkable"],
  state: [
    {
      key: "color",
      kind: "enum",
      label: "颜色",
      default: "yellow",
      options: [{ value: "yellow" }, { value: "pink" }],
    },
    {
      key: "raised",
      kind: "boolean",
      label: "升起",
      default: true,
    },
  ],
  presentation: { name: "Color Block" },
};

export const colorBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const raised = context.entity.state?.raised !== false;
    const color = context.entity.state?.color === "pink" ? "pink" : "yellow";
    return tileCell(MapEntityTypeId.COLOR_BLOCK, {
      fields: { color, raised },
    });
  }),
  [{ behavior: statefulBlockBehavior }],
);
