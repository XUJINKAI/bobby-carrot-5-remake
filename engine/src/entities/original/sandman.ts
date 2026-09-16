import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  originalModule,
  tileCell,
  uprightAtlasVisual,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.SANDMAN,
  presenceFacts: ["blocking"],
  mechanisms: ["object-interaction"],
  presentation: { name: "Sandman", renderPass: "standing" },
};

export const sandman: EntityModule = originalModule(
  definition,
  uprightAtlasVisual(
    definition,
    tileCell(MapEntityTypeId.SANDMAN, { role: "head" }),
    tileCell(MapEntityTypeId.SANDMAN, { role: "body" }),
  ),
);
