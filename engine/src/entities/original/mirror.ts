import { EntityTypeId, type JsonValue } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
  SURFACE_STACK_ORDER,
  variantState,
} from "./module.js";

const rotateMirrorOnLeave: Behavior = {
  id: "rotate-mirror-on-leave",
  onLeave({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      variant: nextMirrorVariant(self.entity.state?.variant),
    });
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.MIRROR,
  traits: ["walkable", "mirror", "rotatable"],
  stackOrder: SURFACE_STACK_ORDER,
  state: variantState([
    "right-bottom",
    "left-bottom",
    "right-top",
    "left-top",
  ]),
  presentation: { name: "Mirror" },
};

export const mirror: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(EntityTypeId.MIRROR, {
      fields: { variant: mirrorVariant(context.entity.state?.variant) },
    }),
  ),
  [{ behavior: rotateMirrorOnLeave }],
);

type MirrorVariant = "right-bottom" | "left-bottom" | "right-top" | "left-top";

function mirrorVariant(value: JsonValue | undefined): MirrorVariant {
  if (value === "left-bottom" || value === "right-top" || value === "left-top")
    return value;
  return "right-bottom";
}

function nextMirrorVariant(value: JsonValue | undefined): MirrorVariant {
  return {
    "right-bottom": "left-bottom",
    "left-bottom": "left-top",
    "left-top": "right-top",
    "right-top": "right-bottom",
  }[mirrorVariant(value)] as MirrorVariant;
}
