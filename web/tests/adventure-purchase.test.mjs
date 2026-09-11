import assert from "node:assert/strict";
import { createAdventureSave } from "@bobby/adventure";
import { test } from "vitest";
import {
  adventureItemReplacementIntent,
  prepareAdventureGameplayLevel,
} from "../src/pages/game/adventurePurchase.ts";

function superKeyOffer() {
  return {
    item: "golden-key",
    currency: "bonus-coins",
    price: 1,
    message: "购买？",
    leftLabel: "购买",
    rightLabel: "算了",
    replacementType: "shop-empty",
    outcomeMessages: {
      "already-owned": "已有",
      purchased: "成交",
      "insufficient-funds": "金币不足",
    },
  };
}

test("已购买商品在进入 Engine 前投影为空商品格", () => {
  const level = {
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [{ type: "lock-key", x: 0, y: 0, collectible: false }],
  };
  const augmentation = {
    levelPatches: [],
    interactions: [{
      id: "test/super-key",
      selector: { type: "lock-key", x: 0, y: 0 },
      effect: { type: "item-purchase", offer: superKeyOffer() },
    }],
  };
  const save = createAdventureSave();
  save.items.push("golden-key");

  assert.deepEqual(
    prepareAdventureGameplayLevel(level, augmentation, save, []).entities,
    [{ type: "shop-empty", x: 0, y: 0 }],
  );
});

test("购买结果按交互位置生成稳定 Entity replacement intent", () => {
  const intent = adventureItemReplacementIntent(superKeyOffer(), {
    type: "object-interaction",
    actorId: 1,
    entityId: 2,
    requestId: 3,
    objectType: "lock-key",
    x: 21,
    y: 6,
    action: "touch",
  });

  assert.deepEqual(intent, {
    type: "commit-entity-replacement",
    target: { type: "lock-key", x: 21, y: 6 },
    replacementType: "shop-empty",
  });
});
