import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
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

const bonusKeyVendor: Behavior = {
  id: "bonus-key-vendor",
  onTouch({ self, query, commands }) {
    if (self.entity.properties?.interaction !== "bonus-key-vendor") return;
    const global = query.global();
    if (global.profile.superKey) {
      emitDialog(commands, self.entity.id, self.presence.cell.x, self.presence.cell.y, "你的金钥匙可以直接打开这把锁。");
      return;
    }
    if (global.inventory.temporaryKey) {
      emitDialog(commands, self.entity.id, self.presence.cell.x, self.presence.cell.y, "你已经拿着一把临时钥匙了。");
      return;
    }
    if (!global.profile.bonusKeyTrialUsed) {
      commands.setGlobal("inventory", {
        ...global.inventory,
        temporaryKey: true,
      });
      commands.setGlobal("profile", {
        ...global.profile,
        bonusKeyTrialUsed: true,
      });
      commands.emit({
        type: "bonus-key-trial-granted",
        entityId: self.entity.id,
        x: self.presence.cell.x,
        y: self.presence.cell.y,
      });
      emitDialog(commands, self.entity.id, self.presence.cell.x, self.presence.cell.y, "第一次免费送你一把体验钥匙。找到锁以后，倒计时才会开始！");
      return;
    }
    if (global.economy.bonusCoins < 3) {
      emitDialog(commands, self.entity.id, self.presence.cell.x, self.presence.cell.y, "临时钥匙需要 3 枚 Bonus Coin。");
      return;
    }
    commands.setGlobal("economy", {
      ...global.economy,
      bonusCoins: global.economy.bonusCoins - 3,
    });
    commands.setGlobal("inventory", {
      ...global.inventory,
      temporaryKey: true,
    });
    commands.emit({
      type: "spend-bonus-coins",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { amount: 3 },
    });
    emitDialog(commands, self.entity.id, self.presence.cell.x, self.presence.cell.y, "成交！这把临时钥匙只够开一次锁。");
  },
};

function emitDialog(
  commands: WorldCommandApi,
  entityId: EntityId,
  x: number,
  y: number,
  text: string,
): void {
  commands.emit({ type: "dialog", entityId, x, y, text });
}

const definition: EntityModuleDefinition = {
  type: EntityTypeId.BEAVER,
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
  properties: [
    {
      key: "interaction",
      kind: "enum",
      label: "交互",
      default: "dialog",
      options: [
        { value: "dialog", label: "对话" },
        { value: "bonus-key-vendor", label: "Bonus 临时钥匙" },
      ],
    },
  ],
  presentation: { name: "Beaver" },
};

export const beaver: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body" ? objectCell(46) : objectCell(30),
  ),
  [{ behavior: bonusKeyVendor }],
);
