import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  originalModule,
  SURFACE_STACK_ORDER,
  tileCell,
  atlasVisual,
} from "./module.js";

const lockKeyInteraction: Behavior = {
  id: "lock-key-interaction",
  canEnter({ self }) {
    if (self.entity.state?.collectible !== false) return;
    return { passable: false, reason: "lock-key-display" };
  },
  onTouch({ actor, self, commands }) {
    if (self.entity.state?.collectible !== false) return;
    commands.emit({
      type: "object-interaction",
      actorId: actor.id,
      entityId: self.entity.id,
      objectType: self.entity.type,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      action: "touch",
    });
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.LOCK_KEY,
  traits: ["walkable", "pickup"],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  properties: [
    {
      key: "collectible",
      kind: "boolean",
      label: "可拾取",
      default: true,
    },
  ],
  presentation: { name: "Lock Key" },
};

export const lockKey: EntityModule = originalModule(
  definition,
  atlasVisual(definition, tileCell(MapEntityTypeId.LOCK_KEY)),
  [{ behavior: lockKeyInteraction }],
);
