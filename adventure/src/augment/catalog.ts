import { MapEntityTypeId, type LevelPatch } from "@bobby/model";
import { parseAdventureLevelId } from "../campaign.js";
import { hasAdventureItem, type AdventureSave } from "../save.js";
import {
  purchaseAdventureItem,
  resolveBonusKeyVendorInteraction,
  type BonusKeyVendorOutcome,
} from "./interactions.js";
import type {
  AdventureAugmentation,
  AdventureInteractionContext,
} from "./types.js";

const EMPTY_AUGMENTATION: AdventureAugmentation = Object.freeze({
  levelPatches: Object.freeze([]),
});

const SUPER_KEY_OUTCOME_MESSAGES = {
  "already-owned": "这把 Super Key 已经是你的了。",
  purchased: "成交，这把 Super Key 归你了。",
  "insufficient-funds": "金币不够，攒到1枚再来吧。",
} as const;

const BONUS_KEY_MESSAGES: Readonly<Record<BonusKeyVendorOutcome, string>> = {
  "permanent-key-owned": "你的永久钥匙可以直接打开这把锁。",
  "lock-key-held": "你已经带着一把关卡钥匙了。",
  "trial-granted": "第一次免费送你一把体验钥匙。找到锁以后，倒计时才会开始！",
  purchased: "成交！这把钥匙只够开一次锁。",
  "insufficient-funds": "Bonus Coin 不足；这把关卡钥匙需要3枚。",
};

const BEAVER_SHOP: AdventureAugmentation = {
  levelPatches: [
    dialoguePatch(MapEntityTypeId.BEAVER, [
      "商店还在装修中，不过你可以随意逛逛...",
      "话说，你知道我是怎么到这儿的吗？",
      "那天，突然出现了一个家伙，他说他叫 XUJINKAI，说是要给我搬家，然后不由分说就把我的店铺打包带走了...",
      "我都拦不住他，然后就稀里糊涂来到这儿了。",
      "不过那家伙不错，说是我的道具用处不大了，想帮我把商店改成展览馆。",
      "你说他不会是画饼吧...",
      "算了，你随便逛吧...",
    ]),
    dialoguePatch(MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET, "陈列着 Dream Machine 车票，听说现在不需要买票了。"),
    dialoguePatch(MapEntityTypeId.SHOP_CLOUD9_TICKET, "陈列着 Cloud 9 车票，听说现在不需要买票了。"),
    dialoguePatch(MapEntityTypeId.SHOP_STEREO_SYSTEM, "陈列着 立体声系统，听说现在大家都用无线耳机了。"),
    dialoguePatch(MapEntityTypeId.SHOP_EXTRA_MUSIC, "陈列着 附赠音乐，听说现在大家都喜欢在线听歌。"),
    dialoguePatch(MapEntityTypeId.SHOP_SPEED_SHOES, "陈列着 速度鞋，现在似乎用不上了。"),
    dialoguePatch(MapEntityTypeId.SHOP_COIN_RADAR, "陈列着 金币雷达，现在似乎用不上了。"),
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.PORTAL,
        x: 9,
        y: 13,
        channel: "beaver-shop-shortcut",
        color: "#54e8ff",
      },
    },
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.PORTAL,
        x: 17,
        y: 8,
        channel: "beaver-shop-shortcut",
        color: "#54e8ff",
      },
    },
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.LOCK_KEY, x: 21, y: 6 },
      fields: { collectible: false },
    },
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.DREAM_MACHINE,
        x: 21,
        y: 8,
        dialogue: [
          "哔哔~我从其他地方搞来了传送门，哔哔~",
          "哔哔~我是勤奋的科研机器，哔哔~",
        ],
      },
    },
  ],
  savePatches: createLevelPatches,
  interaction: interactWithBeaverShop,
};

const SPECIAL_SCENES: Readonly<Record<string, AdventureAugmentation>> = {
  "beaver-shop": BEAVER_SHOP,
  "dream-machine": {
    levelPatches: [
      dialoguePatch(MapEntityTypeId.BEAVER, [
        "我还在调试设备。",
      ]),
      dialoguePatch(
        MapEntityTypeId.DREAM_MACHINE,
        "哔哔~你有见过我的兄弟吗？哔哔~",
      ),
    ],
  },
  "cloud-9": {
    levelPatches: [
      dialoguePatch(
        MapEntityTypeId.SANDMAN,
        "听说，XUJINKAI 为了给海狸先生搬家，花了很大的精力...",
      ),
    ],
  },
  "dreamland-reward": {
    levelPatches: [
      dialoguePatch(
        MapEntityTypeId.SANDMAN,
        "咳咳...我...我是怎么到这儿的...",
      ),
    ],
  },
};

const BONUS_LEVEL_AUGMENTATION: AdventureAugmentation = {
  levelPatches: [],
  interaction: interactWithBonusBeaver,
};

/** 每张 Adventure 内容的地图补丁与可选交互回调都从此目录读取。 */
export function adventureAugmentationFor(
  contentId: string,
): AdventureAugmentation {
  const scene = SPECIAL_SCENES[contentId];
  if (scene) return scene;
  if (parseAdventureLevelId(contentId)?.kind === "bonus")
    return BONUS_LEVEL_AUGMENTATION;
  return EMPTY_AUGMENTATION;
}

function dialoguePatch(
  type: string,
  dialogue: string | readonly string[],
): LevelPatch {
  return {
    operation: "set-fields",
    selector: { type },
    fields: { dialogue },
  };
}

function createLevelPatches(save: AdventureSave): readonly LevelPatch[] {
  if (!hasAdventureItem(save, "golden-key")) return [];
  return [{
    operation: "replace-type",
    selector: { type: MapEntityTypeId.LOCK_KEY, x: 21, y: 6 },
    type: MapEntityTypeId.SHOP_EMPTY,
  }];
}

async function interactWithBeaverShop(
  context: AdventureInteractionContext,
): Promise<void> {
  if (
    context.request.objectType !== MapEntityTypeId.LOCK_KEY ||
    context.request.action !== "touch" ||
    context.request.x !== 21 ||
    context.request.y !== 6
  ) {
    return;
  }
  const selection = await context.presentDialogue({
    message: "也不知搬家以后钥匙能不能用了，你要的话1块钱收走吧",
    options: [
      { id: "purchase", label: "购买" },
      { id: "cancel", label: "算了" },
    ],
  });
  if (selection.type !== "selected" || selection.optionId !== "purchase")
    return;
  const purchase = purchaseAdventureItem(
    context.save,
    "golden-key",
    "bonus-coins",
    1,
  );
  if (purchase.outcome === "purchased") {
    context.commitSave(purchase.save);
    context.replaceInteractedEntity(MapEntityTypeId.SHOP_EMPTY);
  }
  context.showDialogue(SUPER_KEY_OUTCOME_MESSAGES[purchase.outcome]);
}

function interactWithBonusBeaver(context: AdventureInteractionContext): void {
  if (
    context.request.objectType !== MapEntityTypeId.BEAVER ||
    context.request.action !== "touch" ||
    (context.request.role !== undefined && context.request.role !== "body")
  ) {
    return;
  }
  const decision = resolveBonusKeyVendorInteraction(context.save, {
    lockKeyCount: context.request.lockKeyCount,
    priceBonusCoins: 3,
  });
  if (decision.grantLockKey) {
    context.addActorInventoryItem(
      MapEntityTypeId.LOCK_KEY,
      1,
      decision.save,
    );
  }
  context.showDialogue(BONUS_KEY_MESSAGES[decision.outcome]);
}
