import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  directionCell,
  tileCell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.TIDE,
  traits: ["water", "forced-movement"],
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Tide" },
};

export const tide: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    directionCell(
      context.entity.direction,
      tileCell(EntityTypeId.TIDE, { fields: { direction: "up" } }),
      tileCell(EntityTypeId.TIDE, { fields: { direction: "down" } }),
      tileCell(EntityTypeId.TIDE, { fields: { direction: "left" } }),
      tileCell(EntityTypeId.TIDE, { fields: { direction: "right" } }),
    ),
  ),
);
