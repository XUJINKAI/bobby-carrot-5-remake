import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
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
  type: MapEntityTypeId.LEAF,
  presenceFacts: ["moving-platform", "walkable", "blocking"],
  state: [
    { key: "moving", kind: "boolean", label: "移动中", default: false },
  ],
  presentation: { name: "Leaf" },
};

const module = originalModule(
  definition,
  {
    ...atlasVisual(definition, tileCell(MapEntityTypeId.LEAF)),
    supportHeightPx: MOVING_PLATFORM_SUPPORT_HEIGHT_PX,
  },
  [{ behavior: movingPlatformBehavior }],
);

export const leaf: EntityModule = {
  ...module,
  runtimeActions: [movingEntityAction],
};
