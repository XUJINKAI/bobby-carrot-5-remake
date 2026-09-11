import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "../../model/dist/index.js";
import {
  adventureAugmentationFor,
  augmentAdventureLevel,
  createAdventureInteractionState,
  createAdventureSave,
  purchasedAdventureItemPatches,
  purchaseAdventureItem,
  resolveAdventureInteraction,
} from "../dist/index.js";

function sandmanLevel() {
  return {
    schemaVersion: 1,
    width: 4,
    height: 4,
    entities: [{ type: MapEntityTypeId.SANDMAN, x: 1, y: 1 }],
  };
}

test("Adventure can add dialogue without changing the base LevelMap", () => {
  const base = sandmanLevel();
  const augmented = augmentAdventureLevel(base, [
    {
      operation: "set-fields",
      selector: {
        type: MapEntityTypeId.SANDMAN,
        x: 1,
        y: 1,
      },
      fields: { dialogue: "Adventure 自定义对白" },
    },
  ]);
  assert.equal(base.entities[0].dialogue, undefined);
  assert.equal(augmented.entities[0].dialogue, "Adventure 自定义对白");
});

test("prepareAdventureLevel applies field patches before Engine", () => {
  const prepared = augmentAdventureLevel(
    sandmanLevel(),
    [
      {
        operation: "set-fields",
        selector: { x: 1, y: 1 },
        fields: { dialogue: "关卡剧情对白" },
      },
    ],
  );
  assert.equal(prepared.entities[0].dialogue, "关卡剧情对白");
});

test("type-only Adventure patches apply to every matching Entity", () => {
  const level = {
    schemaVersion: 1,
    width: 4,
    height: 4,
    entities: [
      { type: MapEntityTypeId.BEAVER, x: 0, y: 0 },
      { type: MapEntityTypeId.BEAVER, x: 2, y: 0 },
      { type: MapEntityTypeId.LOCK, x: 1, y: 2 },
    ],
  };
  const augmented = augmentAdventureLevel(level, [
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.BEAVER },
      fields: { dialogue: "欢迎来到 Beaver Shop。" },
    },
  ]);
  assert.equal(augmented.entities[0].dialogue, "欢迎来到 Beaver Shop。");
  assert.equal(augmented.entities[1].dialogue, "欢迎来到 Beaver Shop。");
  assert.equal(augmented.entities[2].dialogue, undefined);
});

test("Adventure 声明式补丁支持新增和删除 Entity", () => {
  const base = sandmanLevel();
  const augmented = augmentAdventureLevel(base, [
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.PORTAL,
        x: 0,
        y: 3,
        channel: "test",
        color: "#54e8ff",
      },
    },
    {
      operation: "remove",
      selector: { type: MapEntityTypeId.SANDMAN },
    },
  ]);

  assert.equal(base.entities.length, 1);
  assert.deepEqual(augmented.entities, [
    {
      type: MapEntityTypeId.PORTAL,
      x: 0,
      y: 3,
      channel: "test",
      color: "#54e8ff",
    },
  ]);
});

test("Adventure replace-type 补丁只保留新 Entity 的稳定位置字段", () => {
  const level = {
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [{
      type: MapEntityTypeId.SHOP_SUPER_KEY,
      x: 1,
      y: 0,
      stackOrder: 12,
      futureField: "discarded",
    }],
  };
  const augmented = augmentAdventureLevel(level, [{
    operation: "replace-type",
    selector: { type: MapEntityTypeId.SHOP_SUPER_KEY },
    type: MapEntityTypeId.SHOP_EMPTY,
  }]);

  assert.deepEqual(augmented.entities, [{
    type: MapEntityTypeId.SHOP_EMPTY,
    x: 1,
    y: 0,
    stackOrder: 12,
  }]);
  assert.equal(level.entities[0].type, MapEntityTypeId.SHOP_SUPER_KEY);
});

test("Beaver Shop 数据增加 Portal、Dream Machine 与商品交互", () => {
  const augmentation = adventureAugmentationFor("beaver-shop");
  const level = {
    schemaVersion: 1,
    width: 25,
    height: 20,
    entities: [
      { type: MapEntityTypeId.BEAVER, x: 6, y: 12 },
      { type: MapEntityTypeId.SHOP_SUPER_KEY, x: 21, y: 6 },
    ],
  };
  const augmented = augmentAdventureLevel(level, augmentation.levelPatches);
  assert.deepEqual(
    augmented.entities
      .filter((entity) => entity.type === MapEntityTypeId.PORTAL)
      .map(({ x, y, channel }) => ({ x, y, channel })),
    [
      { x: 11, y: 16, channel: "beaver-shop-shortcut" },
      { x: 17, y: 8, channel: "beaver-shop-shortcut" },
    ],
  );
  assert.deepEqual(
    augmented.entities
      .filter((entity) => entity.type === MapEntityTypeId.DREAM_MACHINE)
      .map(({ x, y }) => ({ x, y })),
    [{ x: 21, y: 8 }],
  );

  const save = createAdventureSave();
  const interactionState = createAdventureInteractionState();
  const beaver = resolveAdventureInteraction(
    augmentation,
    save,
    {
      objectType: MapEntityTypeId.BEAVER,
      x: 6,
      y: 12,
      action: "touch",
      role: "body",
      hasSingleUseKey: false,
    },
    interactionState,
  );
  const itemTypes = [
    MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    MapEntityTypeId.SHOP_SPEED_SHOES,
    MapEntityTypeId.SHOP_COIN_RADAR,
  ];
  const itemDialogues = itemTypes.map((objectType) =>
    resolveAdventureInteraction(
      augmentation,
      save,
      {
        objectType,
        x: 0,
        y: 0,
        action: "touch",
        hasSingleUseKey: false,
      },
      interactionState,
    )?.text
  );
  assert.match(beaver.text, /随意逛/);
  assert.equal(itemDialogues.every(Boolean), true);
  assert.equal(new Set(itemDialogues).size, itemTypes.length);

  const machine = resolveAdventureInteraction(
    augmentation,
    save,
    {
      objectType: MapEntityTypeId.DREAM_MACHINE,
      x: 21,
      y: 8,
      action: "touch",
      role: "body",
      hasSingleUseKey: false,
    },
    interactionState,
  );
  assert.match(machine.text, /传送门/);

  const superKey = resolveAdventureInteraction(
    augmentation,
    save,
    {
      objectType: MapEntityTypeId.SHOP_SUPER_KEY,
      x: 21,
      y: 6,
      action: "touch",
      hasSingleUseKey: false,
    },
    interactionState,
  );
  assert.equal(superKey.type, "item-purchase");
  assert.equal(superKey.offer.item, "golden-key");
  assert.equal(superKey.offer.currency, "bonus-coins");
  assert.equal(superKey.offer.price, 1);
  assert.equal(superKey.offer.replacementType, MapEntityTypeId.SHOP_EMPTY);
  assert.equal(superKey.offer.leftLabel, "购买");
  assert.equal(superKey.offer.rightLabel, "算了");
  assert.match(superKey.offer.message, /1块钱/);

  save.economy.bonusCoins = 1;
  const purchase = purchaseAdventureItem(
    save,
    superKey.offer.item,
    superKey.offer.currency,
    superKey.offer.price,
  );
  assert.equal(purchase.outcome, "purchased");
  assert.equal(purchase.save.economy.bonusCoins, 0);
  assert.deepEqual(purchase.save.items, ["golden-key"]);

  const purchasedLevel = augmentAdventureLevel(
    level,
    purchasedAdventureItemPatches(augmentation, purchase.save),
  );
  assert.equal(
    purchasedLevel.entities.some(
      (entity) => entity.type === MapEntityTypeId.SHOP_SUPER_KEY,
    ),
    false,
  );
  assert.equal(
    purchasedLevel.entities.some(
      (entity) => entity.type === MapEntityTypeId.SHOP_EMPTY,
    ),
    true,
  );
});

test("Adventure 对白数组按规则 ID 独立循环", () => {
  const augmentation = {
    levelPatches: [],
    interactions: [{
      id: "test/cycle",
      selector: { type: MapEntityTypeId.BEAVER, action: "touch" },
      effect: { type: "dialogue", lines: ["第一段", "第二段"] },
    }],
  };
  const save = createAdventureSave();
  const state = createAdventureInteractionState();
  const request = {
    objectType: MapEntityTypeId.BEAVER,
    x: 0,
    y: 1,
    action: "touch",
    role: "body",
    hasSingleUseKey: false,
  };

  const lines = [0, 1, 2].map(() =>
    resolveAdventureInteraction(augmentation, save, request, state).text
  );
  assert.deepEqual(lines, ["第一段", "第二段", "第一段"]);
});

test("Bonus 关卡通过同一数据目录接入钥匙交互", () => {
  const save = createAdventureSave();
  const interaction = resolveAdventureInteraction(
    adventureAugmentationFor("1-bonus-1"),
    save,
    {
      objectType: MapEntityTypeId.BEAVER,
      x: 0,
      y: 0,
      action: "touch",
      role: "body",
      hasSingleUseKey: false,
    },
    createAdventureInteractionState(),
  );

  assert.equal(interaction.type, "bonus-key-vendor");
  assert.equal(interaction.decision.outcome, "trial-granted");
  assert.equal(interaction.decision.grantSingleUseKey, true);
});

test("Night Train 三张 Special Scene 都声明角色对白", () => {
  const save = createAdventureSave();
  const requests = [
    ["dream-machine", MapEntityTypeId.DREAM_MACHINE],
    ["cloud-9", MapEntityTypeId.SANDMAN],
    ["dreamland-reward", MapEntityTypeId.SANDMAN],
  ];
  const dialogues = requests.map(([scene, objectType]) =>
    resolveAdventureInteraction(adventureAugmentationFor(scene), save, {
      objectType,
      x: 0,
      y: 0,
      action: "touch",
      hasSingleUseKey: false,
    }, createAdventureInteractionState())?.text
  );

  assert.equal(
    dialogues.every((text) => typeof text === "string" && text.length > 0),
    true,
  );
});
