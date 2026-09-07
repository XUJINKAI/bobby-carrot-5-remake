import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  COVER_STACK_ORDER,
  namedCell,
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
  atlasVisual(definition, (context) =>
    namedCell([
      "ice-block",
      "ice-block-melt-1",
      "ice-block-melt-2",
      "ice-block-melt-3",
    ][boundedInt(context.entity.state?.meltStage, 0, 3, 0)]!),
  ),
);
