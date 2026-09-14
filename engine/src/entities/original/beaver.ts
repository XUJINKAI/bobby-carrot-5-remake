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
  type: MapEntityTypeId.BEAVER,
  facts: ["blocking"],
  mechanisms: ["object-interaction", "dialog"],
  footprint: {
    parts: [
      { dx: 0, dy: -1, role: "head" },
      { dx: 0, dy: 0, role: "body" },
    ],
  },
  presentation: { name: "Beaver" },
};

export const beaver: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body"
      ? tileCell(MapEntityTypeId.BEAVER, { role: "body" })
      : tileCell(MapEntityTypeId.BEAVER, { role: "head" }),
  ),
);
