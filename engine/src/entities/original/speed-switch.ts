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
  EntityTypeId.SPEED_SWITCH,
  "Speed Switch",
  ["walkable", "switch"],
  { state: pressedState },
);

export const speedSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(1, 10) : cell(2, 10),
  ),
);
