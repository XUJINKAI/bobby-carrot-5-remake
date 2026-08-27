import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  coverDefinition,
  objectCell,
  originalModule,
} from "./module.js";

const definition = coverDefinition(
  EntityTypeId.ICE_BLOCK,
  "Ice Block",
  ["meltable", "blocking"],
  {
    state: [
      {
        key: "meltStage",
        kind: "enum",
        label: "融化阶段",
        default: 0,
        options: [0, 1, 2, 3].map((value) => ({ value })),
      },
    ],
  },
);

export const iceBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    objectCell(26 + boundedInt(context.entity.state?.meltStage, 0, 3, 0)),
  ),
);
