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
} from "./module.js";
import { waterPassage } from "./water-passage.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.TIDE,
  presenceFacts: ["water"],
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
  [{ behavior: waterPassage }],
);
