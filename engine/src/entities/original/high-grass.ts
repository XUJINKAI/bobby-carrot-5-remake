import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { VisualResolveContext } from "../../visual/VisualDefinition.js";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import { mowableBehavior } from "../behaviorLibrary.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  COVER_STACK_ORDER,
  originalModule,
  tileCell,
} from "./module.js";
import { hasBobbyBridgeAt } from "./terrain-semantics.js";

const bobbyBridgeOnCover: Behavior = {
  id: "bobby-bridge-on-cover",
  canEnter({ actor, self, query }) {
    if (
      query.entityHasFact(actor.id, "player") &&
      bobbyMountId(actor.state) === null &&
      hasBobbyBridgeAt(query, self.presence.cell)
    ) {
      return { passable: true, reason: "bridge-over-covered-terrain" };
    }
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.HIGH_GRASS,
  facts: ["blocking"],
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass" },
};

export const highGrass: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.HIGH_GRASS, {
      ...(coversObjective(context) ? { phase: "objective" } : {}),
    }),
  ),
  [{ behavior: mowableBehavior }, { behavior: bobbyBridgeOnCover }],
);

function coversObjective(context: VisualResolveContext): boolean {
  // 同格叠放是 LevelMap 对高草隐藏目标的语义表达，见 docs/system/original/mechanics.md。
  return context.query.presencesAt(context.presence.cell).some((presence) => {
    const type = context.query.entity(presence.entityId)?.type;
    return type === MapEntityTypeId.CARROT || type === MapEntityTypeId.EGG;
  });
}
