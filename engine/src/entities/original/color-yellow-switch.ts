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
  EntityTypeId.COLOR_YELLOW_SWITCH,
  "Yellow Switch",
  ["walkable", "switch"],
  { state: pressedState },
);

export const colorYellowSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(0, 12) : cell(15, 11),
  ),
);
