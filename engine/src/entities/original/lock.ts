import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const unlock: Behavior = {
  id: "lock",
  canEnter({ self, query, commands }) {
    if (self.entity.state?.opened === true)
      return { passable: true, reason: "lock-open" };

    const global = query.global();
    const hasPermanentKey = global.profile.superKey;
    const hasTemporaryKey = global.inventory.temporaryKey;
    if (!hasPermanentKey && !hasTemporaryKey)
      return { passable: false, reason: "lock-needs-key" };

    const seconds = boundedInt(
      self.entity.properties?.deathCountdownSeconds,
      0,
      3600,
      0,
    );
    commands.setState(self.entity.id, {
      ...(self.entity.state ?? {}),
      opened: true,
      deathCountdownRemainingMs: seconds * 1000,
    });
    if (!hasPermanentKey && hasTemporaryKey)
      commands.setGlobal("inventory", {
        ...global.inventory,
        temporaryKey: false,
      });
    if (seconds > 0)
      commands.emit({
        type: "death-countdown-started",
        entityId: self.entity.id,
        data: { seconds },
      });
    return { passable: true, reason: "lock-unlocked" };
  },
  onTick({ self, time, commands }) {
    if (!time || self.entity.state?.opened !== true) return;
    const remaining = Number(self.entity.state.deathCountdownRemainingMs ?? 0);
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const next = Math.max(0, remaining - time.stepMs);
    commands.setState(self.entity.id, {
      ...(self.entity.state ?? {}),
      deathCountdownRemainingMs: next,
    });
    if (next > 0) return;
    commands.setGlobal("dead", true);
    commands.setGlobal("deathReason", "Time ran out.");
    commands.emit({
      type: "death",
      entityId: self.entity.id,
      reason: "death-countdown-expired",
    });
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.LOCK,
  traits: ["blocking", "gate"],
  stackOrder: CONTENT_STACK_ORDER,
  properties: [
    {
      key: "deathCountdownSeconds",
      kind: "number",
      label: "死亡倒计时（秒）",
      default: 0,
    },
  ],
  state: [
    { key: "opened", kind: "boolean", label: "已开启", default: false },
    {
      key: "deathCountdownRemainingMs",
      kind: "number",
      label: "倒计时剩余毫秒",
      default: 0,
    },
  ],
  presentation: { name: "Lock" },
};

export const lock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.opened === true ? null : objectCell(4),
  ),
  [{ behavior: unlock }],
);
