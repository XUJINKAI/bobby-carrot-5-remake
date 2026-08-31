import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
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
  presentation: { name: "Sandman" },
};

const sandmanDialog: Behavior = {
  id: "sandman-dialog",
  onTouch({ self, commands }) {
    const dialogId = self.entity.properties?.dialogId;
    if (typeof dialogId !== "string" || dialogId.length === 0) return;
    commands.emit({
      type: "dialog",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      messageId: dialogId,
    });
  },
};

export const sandman: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body" ? objectCell(33) : objectCell(17),
  ),
  [{ behavior: sandmanDialog }],
);
