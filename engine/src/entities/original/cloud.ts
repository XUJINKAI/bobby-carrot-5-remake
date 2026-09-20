import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { cloudColor } from "./cloud-movement.js";
import {
  movingEntityAction,
  movingPlatformBehavior,
  MOVING_PLATFORM_SUPPORT_HEIGHT_PX,
} from "./moving-platform.js";
import {
  atlasVisual,
  originalModule,
  tileCell,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.CLOUD,
  presenceFacts: ["moving-platform", "walkable", "blocking"],
  state: [
    {
      key: "color",
      kind: "enum",
      label: "颜色",
      default: "red",
      options: [{ value: "red" }, { value: "purple" }, { value: "green" }],
    },
    { key: "moving", kind: "boolean", label: "移动中", default: false },
  ],
  presentation: { name: "Cloud" },
};

const module = originalModule(
  definition,
  {
    ...atlasVisual(definition, (context) =>
      tileCell(MapEntityTypeId.CLOUD, {
        fields: { color: cloudColor(context.entity.state?.color) },
      }),
    ),
    supportHeightPx: MOVING_PLATFORM_SUPPORT_HEIGHT_PX,
  },
  [{ behavior: movingPlatformBehavior }],
);

export const cloud: EntityModule = {
  ...module,
  runtimeActions: [movingEntityAction],
};
