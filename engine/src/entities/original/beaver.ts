import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  bobbyMountId,
  readBobbyInventory,
  patchBobbyInventory,
} from "../player/BobbyState.js";
import {
  atlasVisual,
  boundedInt,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const DEFAULT_TEMPORARY_KEY_PRICE = 3;

const bonusKeyVendor: Behavior = {
  id: "bonus-key-vendor",
  onTouch({ actor, self, query, commands }) {
    if (self.entity.state?.interaction !== "bonus-key-vendor") return;
    if (bobbyMountId(actor.state) !== null) return;
    const global = query.global();
    const inventory = readBobbyInventory(actor.state);
    const price = boundedInt(
      self.entity.state?.temporaryKeyPriceBonusCoins,
      0,
      9999,
      DEFAULT_TEMPORARY_KEY_PRICE,
    );
    if (global.profile.superKey) {
      emitDialog(
        commands,
        self.entity.id,
        self.presence.cell.x,
        self.presence.cell.y,
        "你的金钥匙可以直接打开这把锁。",
      );
      return;
    }
    if (inventory.temporaryKey) {
      emitDialog(
        commands,
        self.entity.id,
        self.presence.cell.x,
        self.presence.cell.y,
        "你已经拿着一把临时钥匙了。",
      );
      return;
    }
    if (!global.profile.bonusKeyTrialUsed) {
      commands.setState(
        actor.id,
        patchBobbyInventory(actor.state, { temporaryKey: true }),
      );
      commands.setGlobal("profile", {
        ...global.profile,
        bonusKeyTrialUsed: true,
      });
      commands.emit({
        type: "bonus-key-trial-granted",
        entityId: actor.id,
        x: self.presence.cell.x,
        y: self.presence.cell.y,
      });
      emitDialog(
        commands,
        self.entity.id,
        self.presence.cell.x,
        self.presence.cell.y,
        "第一次免费送你一把体验钥匙。找到锁以后，倒计时才会开始！",
      );
      return;
    }
    if (global.economy.bonusCoins < price) {
      emitDialog(
        commands,
        self.entity.id,
        self.presence.cell.x,
        self.presence.cell.y,
        `临时钥匙需要 ${price} 枚 Bonus Coin。`,
      );
      return;
    }
    commands.setGlobal("economy", {
      ...global.economy,
      bonusCoins: global.economy.bonusCoins - price,
    });
    commands.setState(
      actor.id,
      patchBobbyInventory(actor.state, { temporaryKey: true }),
    );
    commands.emit({
      type: "spend-bonus-coins",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { amount: price },
    });
    emitDialog(
      commands,
      self.entity.id,
      self.presence.cell.x,
      self.presence.cell.y,
      "成交！这把临时钥匙只够开一次锁。",
    );
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
    {
      key: "temporaryKeyPriceBonusCoins",
      kind: "number",
      label: "临时钥匙 Bonus Coin 价格",
      default: DEFAULT_TEMPORARY_KEY_PRICE,
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
