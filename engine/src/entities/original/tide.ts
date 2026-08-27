import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  cell,
  directionCell,
  originalModule,
  surfaceDefinition,
} from "./module.js";

const definition = surfaceDefinition(
  EntityTypeId.TIDE,
  "Tide",
  ["water", "forced-movement"],
  {
    authoring: {
      palette: true,
      category: "水域",
      defaultDirection: "right",
    },
    presentation: { name: "Tide", category: "水域" },
  },
);

export const tide: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    directionCell(
      context.entity.direction,
      cell(7, 5),
      cell(8, 5),
      cell(9, 5),
      cell(10, 5),
    ),
  ),
);
