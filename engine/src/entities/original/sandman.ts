import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.SANDMAN,
  traits: ["blocking", "dialog"],
  stackOrder: CONTENT_STACK_ORDER,
  footprint: {
    rotateWithDirection: true,
    baseDirection: "down",
    parts: [
      { dx: 0, dy: 0, role: "head" },
      { dx: 0, dy: 1, role: "body" },
    ],
  },
  presentation: { name: "Sandman" },
};

export const sandman: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body" ? objectCell(33) : objectCell(17),
  ),
);
