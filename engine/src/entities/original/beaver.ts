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
  type: MapEntityTypeId.BEAVER,
  presenceFacts: ["blocking"],
  mechanisms: ["object-interaction"],
  presentation: { name: "Beaver", renderPass: "standing" },
};

export const beaver: EntityModule = originalModule(
  definition,
  uprightAtlasVisual(
    definition,
    tileCell(MapEntityTypeId.BEAVER, { role: "head" }),
    tileCell(MapEntityTypeId.BEAVER, { role: "body" }),
  ),
);
