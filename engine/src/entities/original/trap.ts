import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  cell,
  originalModule,
  surfaceDefinition,
} from "./module.js";

const definition = surfaceDefinition(
  EntityTypeId.TRAP,
  "Trap",
  ["walkable", "hazard"],
  { state: activeState(true) },
);

export const trap: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.active === false ? cell(0, 11) : cell(15, 10),
  ),
);
