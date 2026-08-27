import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  cell,
  originalModule,
  surfaceDefinition,
} from "./module.js";

const definition = surfaceDefinition(
  EntityTypeId.COLOR_PINK_BLOCK,
  "Pink Block",
  ["stateful-block", "walkable"],
  {
    state: [
      {
        key: "raised",
        kind: "boolean",
        label: "升起",
        default: true,
      },
    ],
  },
);

export const colorPinkBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.raised === false ? cell(6, 12) : cell(5, 12),
  ),
);
