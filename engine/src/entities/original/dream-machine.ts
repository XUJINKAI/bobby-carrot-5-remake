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
  type: MapEntityTypeId.DREAM_MACHINE,
  presenceFacts: ["blocking"],
  mechanisms: ["object-interaction"],
  presentation: { name: "Dream Machine", renderPass: "standing" },
};

export const dreamMachine: EntityModule = originalModule(
  definition,
  uprightAtlasVisual(
    definition,
    tileCell(MapEntityTypeId.DREAM_MACHINE, { role: "head" }),
    tileCell(MapEntityTypeId.DREAM_MACHINE, { role: "body" }),
  ),
);
