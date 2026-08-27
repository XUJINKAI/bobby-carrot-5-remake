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
  EntityTypeId.SPEED,
  "Speed",
  ["walkable", "forced-movement"],
  {
    authoring: {
      palette: true,
      category: "机关",
      defaultDirection: "right",
    },
    presentation: { name: "Speed", category: "机关" },
  },
);

export const speed: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    directionCell(
      context.entity.direction,
      cell(5, 11),
      cell(6, 11),
      cell(7, 11),
      cell(8, 11),
    ),
  ),
);
