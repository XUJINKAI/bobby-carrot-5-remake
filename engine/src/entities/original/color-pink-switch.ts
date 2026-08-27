import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  cell,
  originalModule,
  pressedState,
  surfaceDefinition,
} from "./module.js";

const definition = surfaceDefinition(
  EntityTypeId.COLOR_PINK_SWITCH,
  "Pink Switch",
  ["walkable", "switch"],
  { state: pressedState },
);

export const colorPinkSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(2, 12) : cell(1, 12),
  ),
);
