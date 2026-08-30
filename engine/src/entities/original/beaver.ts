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
  type: EntityTypeId.BEAVER,
  traits: ["blocking"],
  stackOrder: CONTENT_STACK_ORDER,
  footprint: {
    rotateWithDirection: true,
    baseDirection: "down",
    parts: [
      { dx: 0, dy: 0, role: "head" },
      { dx: 0, dy: 1, role: "body" },
    ],
  },
  presentation: { name: "Beaver", category: "角色" },
  authoring: {
    palette: true,
    category: "角色",
    defaultDirection: "down",
  },
};

export const beaver: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body" ? objectCell(46) : objectCell(30),
  ),
);
