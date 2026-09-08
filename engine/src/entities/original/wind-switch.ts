import { EntityTypeId, type Direction } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  tileCell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const WIND_SWITCH_DIRECTIONS: readonly Direction[] = [
  "up",
  "down",
  "left",
  "right",
];

const toggleWindDirection: Behavior = {
  id: "wind-switch-direction-toggle",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
    const direction = self.entity.direction;
    if (!direction) return;
    const active = self.entity.state?.active !== true;

    for (const entity of query.entitiesWithTrait("switch")) {
      if (entity.type !== EntityTypeId.WIND_SWITCH) continue;
      if (entity.direction !== direction) continue;
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
  state: activeState(false),
  presentation: { name: "Wind Switch" },
};

export const windSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const direction: Direction = WIND_SWITCH_DIRECTIONS.includes(
      context.entity.direction as (typeof WIND_SWITCH_DIRECTIONS)[number],
    )
      ? context.entity.direction as Direction
      : "up";
    const active = context.entity.state?.active === true;
    return tileCell(EntityTypeId.WIND_SWITCH, {
      fields: { direction, active },
    });
  }),
  [{ behavior: toggleWindDirection }],
);
