import test from "node:test";
import assert from "node:assert/strict";
import {
  MapEntityTypeId,
  applyLevelPatches,
} from "../../model/dist/index.js";
import {
  adventureAugmentationFor,
  createAdventureSave,
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
  const augmented = applyLevelPatches(base, [
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
  const prepared = applyLevelPatches(
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
  const augmented = applyLevelPatches(level, [
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
  const augmented = applyLevelPatches(base, [
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
      type: MapEntityTypeId.LOCK_KEY,
      x: 1,
      y: 0,
      stackOrder: 12,
      futureField: "discarded",
    }],
  };
  const augmented = applyLevelPatches(level, [{
    operation: "replace-type",
    selector: { type: MapEntityTypeId.LOCK_KEY },
    type: MapEntityTypeId.SHOP_EMPTY,
  }]);

  assert.deepEqual(augmented.entities, [{
    type: MapEntityTypeId.SHOP_EMPTY,
    x: 1,
    y: 0,
    stackOrder: 12,
  }]);
  assert.equal(level.entities[0].type, MapEntityTypeId.LOCK_KEY);
});

test("Beaver Shop 通过地图补丁增加场景内容与字面对白", () => {
  const augmentation = adventureAugmentationFor("beaver-shop");
  const level = {
    schemaVersion: 1,
    width: 25,
    height: 20,
    entities: [
      { type: MapEntityTypeId.BEAVER, x: 6, y: 12 },
      { type: MapEntityTypeId.LOCK_KEY, x: 21, y: 6 },
      { type: MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET, x: 1, y: 1 },
      { type: MapEntityTypeId.SHOP_CLOUD9_TICKET, x: 2, y: 1 },
      { type: MapEntityTypeId.SHOP_STEREO_SYSTEM, x: 3, y: 1 },
      { type: MapEntityTypeId.SHOP_EXTRA_MUSIC, x: 4, y: 1 },
      { type: MapEntityTypeId.SHOP_SPEED_SHOES, x: 5, y: 1 },
      { type: MapEntityTypeId.SHOP_COIN_RADAR, x: 6, y: 1 },
    ],
  };
  const augmented = applyLevelPatches(level, augmentation.levelPatches);
  assert.equal(
    augmented.entities.find(
      (entity) => entity.type === MapEntityTypeId.LOCK_KEY,
    )?.collectible,
    false,
  );
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
  const beaver = augmented.entities.find(
    (entity) => entity.type === MapEntityTypeId.BEAVER,
  );
  const itemTypes = [
    MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    MapEntityTypeId.SHOP_SPEED_SHOES,
    MapEntityTypeId.SHOP_COIN_RADAR,
  ];
  const itemDialogues = itemTypes.map(
    (type) => augmented.entities.find((entity) => entity.type === type)?.dialogue,
  );
  assert.ok(Array.isArray(beaver.dialogue));
  assert.match(beaver.dialogue[0], /随意逛/);
  assert.equal(itemDialogues.every(Boolean), true);
  assert.equal(new Set(itemDialogues).size, itemTypes.length);
  const machine = augmented.entities.find(
    (entity) =>
      entity.type === MapEntityTypeId.DREAM_MACHINE &&
      entity.x === 21 &&
      entity.y === 8,
  );
  assert.match(machine.dialogue[0], /传送门/);
});

test("Beaver Shop interaction 回调直接完成 Super Key 购买", async () => {
  const augmentation = adventureAugmentationFor("beaver-shop");
  const save = createAdventureSave();
  save.economy.bonusCoins = 1;
  let committed = null;
  let replacement = null;
  let message = null;
  await augmentation.interaction({
    request: {
      requestId: 3,
      actorId: 1,
      entityId: 2,
      objectType: MapEntityTypeId.LOCK_KEY,
      x: 21,
      y: 6,
      action: "touch",
      lockKeyCount: 0,
    },
    save,
    showDialogue: (text) => {
      message = text;
    },
    presentDialogue: async (presentation) => {
      assert.match(presentation.message, /1块钱/);
      assert.deepEqual(
        presentation.options.map((option) => option.label),
        ["购买", "算了"],
      );
      return { type: "selected", optionId: "purchase" };
    },
    commitSave: (next) => {
      committed = next;
    },
    addActorInventoryItem: () => assert.fail("商店购买不应发放关卡钥匙"),
    replaceInteractedEntity: (type) => {
      replacement = type;
    },
  });
  assert.equal(committed.economy.bonusCoins, 0);
  assert.deepEqual(committed.items, ["golden-key"]);
  assert.equal(replacement, MapEntityTypeId.SHOP_EMPTY);
  assert.match(message, /成交/);

  const purchasedLevel = applyLevelPatches(
    {
      schemaVersion: 1,
      width: 25,
      height: 20,
      entities: [{ type: MapEntityTypeId.LOCK_KEY, x: 21, y: 6 }],
    },
    augmentation.savePatches(committed),
  );
  assert.equal(
    purchasedLevel.entities.some(
      (entity) => entity.type === MapEntityTypeId.LOCK_KEY,
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

test("Bonus 关卡通过 interaction 回调接入钥匙交互", async () => {
  const save = createAdventureSave();
  const augmentation = adventureAugmentationFor("1-bonus-1");
  let granted = null;
  let message = null;
  await augmentation.interaction({
    request: {
      requestId: 7,
      actorId: 1,
      entityId: 2,
      objectType: MapEntityTypeId.BEAVER,
      x: 0,
      y: 0,
      action: "touch",
      role: "body",
      lockKeyCount: 0,
    },
    save,
    showDialogue: (text) => {
      message = text;
    },
    presentDialogue: async () => ({ type: "dismissed" }),
    commitSave: () => assert.fail("发放关卡钥匙应等待 Engine 接受"),
    addActorInventoryItem: (item, count, saveOnAccepted) => {
      granted = { item, count, saveOnAccepted };
    },
    replaceInteractedEntity: () => assert.fail("Bonus Beaver 不替换 Entity"),
  });

  assert.equal(granted.item, MapEntityTypeId.LOCK_KEY);
  assert.equal(granted.count, 1);
  assert.ok(granted.saveOnAccepted.campaign.completedEvents.includes(
    "bonus-key-trial",
  ));
  assert.match(message, /体验钥匙/);
});

test("Night Train 三张 Special Scene 都把角色对白写入地图", () => {
  const requests = [
    ["dream-machine", MapEntityTypeId.DREAM_MACHINE],
    ["cloud-9", MapEntityTypeId.SANDMAN],
    ["dreamland-reward", MapEntityTypeId.SANDMAN],
  ];
  const dialogues = requests.map(([scene, objectType]) => {
    const level = {
      schemaVersion: 1,
      width: 1,
      height: 1,
      entities: [{ type: objectType, x: 0, y: 0 }],
    };
    return applyLevelPatches(
      level,
      adventureAugmentationFor(scene).levelPatches,
    ).entities[0].dialogue;
  });

  assert.equal(
    dialogues.every((text) => typeof text === "string" && text.length > 0),
    true,
  );
});
