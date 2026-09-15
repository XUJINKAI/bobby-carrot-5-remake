import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.SANDMAN,
  presenceFacts: ["blocking"],
  mechanisms: ["object-interaction"],
  footprint: {
    parts: [
      { dx: 0, dy: -1, role: "head" },
      { dx: 0, dy: 0, role: "body" },
    ],
  },
  presentation: { name: "Sandman", renderPass: "standing" },
};

export const sandman: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body"
      ? tileCell(MapEntityTypeId.SANDMAN, { role: "body" })
      : tileCell(MapEntityTypeId.SANDMAN, { role: "head" }),
  ),
);
