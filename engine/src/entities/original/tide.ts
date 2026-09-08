import { MapEntityTypeId } from "@bobby/model";
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
  type: MapEntityTypeId.TIDE,
  traits: ["water", "forced-movement"],
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Tide" },
};

export const tide: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    directionCell(
      context.entity.direction,
      tileCell(MapEntityTypeId.TIDE, { fields: { direction: "up" } }),
      tileCell(MapEntityTypeId.TIDE, { fields: { direction: "down" } }),
      tileCell(MapEntityTypeId.TIDE, { fields: { direction: "left" } }),
      tileCell(MapEntityTypeId.TIDE, { fields: { direction: "right" } }),
    ),
  ),
);
