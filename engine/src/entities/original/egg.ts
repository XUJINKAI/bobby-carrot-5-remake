import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import { atlasVisual, originalModule, tileCell } from "./module.js";

const fillEggOnLeave: Behavior = {
  id: "fill-egg-on-leave",
  onLeave({ actor, self, query, commands }) {
    if (
      self.entity.state?.filled === true ||
      !query.entityHasFact(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    ) return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      filled: true,
    });
    commands.emit({
      type: "fill-egg-nest",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
  canEnter({ self }) {
    if (self.entity.state?.filled === true) {
      return { passable: false, reason: "filled-egg" };
    }
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.EGG,
  presenceFacts: ["vertical-occupant"],
  resolvePresenceFacts({ entity }) {
    return entity.state?.filled === true ? ["blocking"] : [];
  },
  presentation: { name: "Egg" },
};

export const egg: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.filled === true
      ? tileCell(MapEntityTypeId.EGG, { phase: "filled" })
      : tileCell(MapEntityTypeId.EGG),
  ),
  [{ behavior: fillEggOnLeave }],
);
