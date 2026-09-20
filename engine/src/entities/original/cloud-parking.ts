import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { cloudColor } from "./cloud-movement.js";
import {
  atlasVisual,
  originalModule,
  tileCell,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.CLOUD_PARKING,
  presenceFacts: ["vertical-occupant"],
  presentation: { name: "Cloud Parking" },
};

export const cloudParking: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.CLOUD_PARKING, {
      fields: { color: cloudColor(context.entity.state?.color) },
    }),
  ),
);
