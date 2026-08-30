import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  cell,
  directionCell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.SPEED,
  traits: ["walkable", "forced-movement"],
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Speed", category: "机关" },
  authoring: {
    palette: true,
    category: "机关",
    replaceGroup: "surface",
    defaultDirection: "right",
  },
};

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
