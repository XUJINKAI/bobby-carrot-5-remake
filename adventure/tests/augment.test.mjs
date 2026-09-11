import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "../../model/dist/index.js";
import {
  adventureAugmentationFor,
  augmentAdventureLevel,
  createAdventureSave,
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

test("Beaver Shop 数据增加 Portal 并为角色和商品提供不同对白", () => {
  const augmentation = adventureAugmentationFor("beaver-shop");
  const level = {
    schemaVersion: 1,
    width: 25,
    height: 20,
    entities: [{ type: MapEntityTypeId.BEAVER, x: 6, y: 12 }],
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

  const save = createAdventureSave();
  const beaver = resolveAdventureInteraction(augmentation, save, {
    objectType: MapEntityTypeId.BEAVER,
    x: 6,
    y: 13,
    action: "touch",
    role: "body",
    hasSingleUseKey: false,
  });
  const itemTypes = [
    MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    MapEntityTypeId.SHOP_SUPER_KEY,
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    MapEntityTypeId.SHOP_SPEED_SHOES,
    MapEntityTypeId.SHOP_COIN_RADAR,
  ];
  const itemDialogues = itemTypes.map((objectType) =>
    resolveAdventureInteraction(augmentation, save, {
      objectType,
      x: 0,
      y: 0,
      action: "enter",
      hasSingleUseKey: false,
    })?.text
  );
  assert.match(beaver.text, /商店暂时不开放/);
  assert.equal(itemDialogues.every(Boolean), true);
  assert.equal(new Set(itemDialogues).size, itemTypes.length);
  assert.match(itemDialogues.at(-2), /Speed Shoes/);
  assert.match(itemDialogues.at(-1), /Coin Radar/);
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
  );

  assert.equal(interaction.type, "bonus-key-vendor");
  assert.equal(interaction.decision.outcome, "trial-granted");
  assert.equal(interaction.decision.grantSingleUseKey, true);
});

test("Night Train 三张 Special Scene 分别声明角色对白", () => {
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
    })?.text
  );

  assert.equal(dialogues.every((text) => text?.includes("暂不开放")), true);
  assert.equal(new Set(dialogues).size, 3);
});
