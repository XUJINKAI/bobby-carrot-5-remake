import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  boundedInt,
  cell,
  originalModule,
  surfaceDefinition,
} from "./module.js";

const definition = surfaceDefinition(
  EntityTypeId.WIND_SWITCH,
  "Wind Switch",
  ["walkable", "switch"],
  {
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
  },
);

export const windSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const channel = boundedInt(context.entity.properties?.channel, 0, 3, 0);
    const active = context.entity.state?.active === true;
    return cell(7 + channel * 2 + (active ? 0 : 1), 10);
  }),
);
