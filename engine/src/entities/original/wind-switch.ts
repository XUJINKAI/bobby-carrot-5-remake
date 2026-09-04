import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
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

const toggleWindChannel: Behavior = {
  id: "wind-switch-channel-toggle",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
    const channel = boundedInt(self.entity.properties?.channel, 0, 3, 0);
    const active = self.entity.state?.active !== true;

    for (const entity of query.entitiesWithTrait("switch")) {
      if (entity.type !== EntityTypeId.WIND_SWITCH) continue;
      if (boundedInt(entity.properties?.channel, 0, 3, 0) !== channel) continue;
      commands.setState(entity.id, {
        ...entity.state,
        active,
      });
    }
  },
};

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
  presentation: { name: "Wind Switch" },
};

export const windSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const channel = boundedInt(context.entity.properties?.channel, 0, 3, 0);
    const active = context.entity.state?.active === true;
    return cell(7 + channel * 2 + (active ? 0 : 1), 10);
  }),
  [{ behavior: toggleWindChannel }],
);
