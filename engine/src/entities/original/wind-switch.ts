import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  boundedInt,
  cell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.WIND_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  properties: [
    {
      key: "channel",
      kind: "enum",
      label: "频道",
      default: 0,
      options: [0, 1, 2, 3].map((value) => ({ value })),
    },
  ],
  state: activeState(false),
  presentation: { name: "Wind Switch", category: "地表" },
  authoring: {
    palette: true,
    category: "地表",
    replaceGroup: "surface",
  },
};

export const windSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const channel = boundedInt(context.entity.properties?.channel, 0, 3, 0);
    const active = context.entity.state?.active === true;
    return cell(7 + channel * 2 + (active ? 0 : 1), 10);
  }),
);
