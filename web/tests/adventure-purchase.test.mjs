import assert from "node:assert/strict";
import { createAdventureSave } from "@bobby/adventure";
import { test } from "vitest";
import {
  prepareAdventureGameplayLevel,
} from "../src/pages/game/adventurePurchase.ts";

test("已购买商品在进入 Engine 前投影为空商品格", () => {
  const level = {
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [{ type: "lock-key", x: 0, y: 0, collectible: false }],
  };
  const augmentation = {
    levelPatches: [],
    savePatches: (current) => current.items.includes("golden-key")
      ? [{
          operation: "replace-type",
          selector: { type: "lock-key", x: 0, y: 0 },
          type: "shop-empty",
        }]
      : [],
  };
  const save = createAdventureSave();
  save.items.push("golden-key");

  assert.deepEqual(
    prepareAdventureGameplayLevel(level, augmentation, save, []).entities,
    [{ type: "shop-empty", x: 0, y: 0 }],
  );
});
