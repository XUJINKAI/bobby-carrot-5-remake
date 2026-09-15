import { MapEntityTypeId } from "@bobby/model";
import { hazardBehavior } from "../behaviorLibrary.js";
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
} from "./module.js";

const armTrapAfterLeave: Behavior = {
  id: "arm-trap-after-leave",
  onLeave({ actor, self, query, commands }) {
    if (!query.entityHasFact(actor.id, "player")) return;
    if (self.entity.state?.active !== false) return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      active: true,
    });
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.TRAP,
  presenceFacts: ["walkable"],
  state: activeState(true),
  presentation: { name: "Trap" },
};

export const trap: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.TRAP, {
      fields: { active: context.entity.state?.active !== false },
    }),
  ),
  [{ behavior: hazardBehavior }, { behavior: armTrapAfterLeave }],
);
