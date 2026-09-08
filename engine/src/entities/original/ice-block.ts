import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  COVER_STACK_ORDER,
  tileAnimationCell,
  tileCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.ICE_BLOCK,
  traits: ["meltable", "blocking"],
  stackOrder: COVER_STACK_ORDER,
  state: [
    {
      key: "meltStage",
      kind: "enum",
      label: "融化阶段",
      default: 0,
      options: [0, 1, 2, 3].map((value) => ({ value })),
    },
  ],
  presentation: { name: "Ice Block" },
};

export const iceBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const stage = boundedInt(context.entity.state?.meltStage, 0, 3, 0);
    return stage === 0
      ? tileCell(EntityTypeId.ICE_BLOCK)
      : tileAnimationCell(EntityTypeId.ICE_BLOCK, "melt", stage);
  }),
);
