import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  cell,
  originalModule,
  surfaceDefinition,
  variantState,
} from "./module.js";

const definition = surfaceDefinition(
  EntityTypeId.MIRROR,
  "Mirror",
  ["walkable", "mirror", "rotatable"],
  { state: variantState([1, 2, 3, 4]) },
);

export const mirror: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    cell(boundedInt(context.entity.state?.variant, 1, 4, 1), 11),
  ),
);
