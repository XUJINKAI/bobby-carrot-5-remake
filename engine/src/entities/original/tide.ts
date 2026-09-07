import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  directionCell,
  namedCell,
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
      namedCell("tide-up"),
      namedCell("tide-down"),
      namedCell("tide-left"),
      namedCell("tide-right"),
    ),
  ),
);
