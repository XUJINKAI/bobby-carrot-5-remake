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
  EntityTypeId.TIDE_SWITCH,
  "Tide Switch",
  ["walkable", "switch"],
  { state: pressedState },
);

export const tideSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.pressed === true ? cell(6, 10) : cell(5, 10),
  ),
);
