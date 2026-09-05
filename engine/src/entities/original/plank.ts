import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const plankPassage: Behavior = {
  id: "plank-passage",
  canEnter({ actor, self, query }) {
    const underlyingWalkable = query
      .presencesAt(self.presence.cell)
      .some(
        (presence) =>
          presence.entityId !== self.entity.id &&
          presence.layer === "surface" &&
          presence.traits.includes("walkable"),
      );
    if (self.entity.state?.spent === true)
      return {
        passable: underlyingWalkable,
        reason: underlyingWalkable ? "spent-plank-on-ground" : "spent-plank",
      };
    if (bobbyMountId(actor.state) !== null && !underlyingWalkable)
      return { passable: false, reason: "mower-cannot-use-plank-bridge" };
    return { passable: true, reason: "plank-bridge" };
  },
  onLeave({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      self.entity.state?.spent === true
    )
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      spent: true,
    });
    commands.emit({
      type: "plank-decay-started",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.PLANK,
  traits: ["terrain-overlay", "walkable"],
  stackOrder: CONTENT_STACK_ORDER,
  state: [
    { key: "spent", kind: "boolean", label: "已失效", default: false },
  ],
  presentation: { name: "Plank" },
};

export const plank: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.spent === true ? objectCell(12) : objectCell(11),
  ),
  [{ behavior: plankPassage }],
);
