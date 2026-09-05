import { EntityTypeId, type JsonValue } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  boundedInt,
  cell,
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
  state: variantState([1, 2, 3, 4]),
  presentation: { name: "Mirror" },
};

export const mirror: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    cell(boundedInt(context.entity.state?.variant, 1, 4, 1), 11),
  ),
  [{ behavior: rotateMirrorOnLeave }],
);

function nextMirrorVariant(value: JsonValue | undefined): 1 | 2 | 3 | 4 {
  const variant = boundedInt(value, 1, 4, 1);
  return ({ 1: 2, 2: 4, 4: 3, 3: 1 } as const)[variant as 1 | 2 | 3 | 4];
}
