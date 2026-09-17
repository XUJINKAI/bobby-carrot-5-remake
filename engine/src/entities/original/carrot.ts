import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import { isRidingMower } from "../behaviorLibrary.js";
import { atlasVisual, originalModule, tileCell } from "./module.js";

const collectCarrot: Behavior = {
  id: "collect-carrot",
  canEnter({ actor, self, query }) {
    if (self.entity.state?.consumed === true || !isRidingMower(actor.state, query))
      return;
    if (query.hasSelectorAt(self.presence.cell, {
      kind: "type",
      value: MapEntityTypeId.HIGH_GRASS,
    }))
      // 高草下的胡萝卜留在格内，Mower 可以进入割草，但不会收集胡萝卜。
      return { passable: true, reason: "objective-hidden-under-grass" };
    return { passable: false, reason: "mower-cannot-collect-carrot" };
  },
  onEnter({ actor, self, query, commands }) {
    if (self.entity.state?.consumed === true || isRidingMower(actor.state, query))
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      consumed: true,
    });
    commands.emit({
      type: "collect-carrot",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.CARROT,
  presenceFacts: ["vertical-occupant"],
  state: [{ key: "consumed", kind: "boolean", label: "已收集", default: false }],
  presentation: { name: "Carrot" },
};

export const carrot: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.consumed === true
      ? tileCell(MapEntityTypeId.CARROT, { phase: "consumed" })
      : tileCell(MapEntityTypeId.CARROT),
  ),
  [{ behavior: collectCarrot }],
);
