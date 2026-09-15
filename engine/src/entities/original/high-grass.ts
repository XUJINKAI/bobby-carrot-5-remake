import { MapEntityTypeId } from "@bobby/model";
import type { VisualResolveContext } from "../../visual/VisualDefinition.js";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import { mowableBehavior } from "../behaviorLibrary.js";
import {
  atlasVisual,
  originalModule,
  tileCell,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.HIGH_GRASS,
  presenceFacts: ["blocking", "contact-cover"],
  presentation: { name: "High Grass" },
};

export const highGrass: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.HIGH_GRASS, {
      ...(coversObjective(context) ? { phase: "objective" } : {}),
    }),
  ),
  [{ behavior: mowableBehavior }],
);

function coversObjective(context: VisualResolveContext): boolean {
  // 同格叠放是 LevelMap 对高草隐藏目标的语义表达，见 docs/system/original/mechanics.md。
  return context.query.presencesAt(context.presence.cell).some((presence) => {
    const type = context.query.entity(presence.entityId)?.type;
    return type === MapEntityTypeId.CARROT || type === MapEntityTypeId.EGG;
  });
}
