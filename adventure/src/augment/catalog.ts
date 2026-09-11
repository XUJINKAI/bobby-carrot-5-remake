import { MapEntityTypeId } from "@bobby/model";
import { parseAdventureLevelId } from "../campaign.js";
import type {
  AdventureAugmentation,
  AdventureInteractionRule,
} from "./types.js";

const EMPTY_AUGMENTATION: AdventureAugmentation = Object.freeze({
  levelPatches: Object.freeze([]),
  interactions: Object.freeze([]),
});

// 对白按顺序循环；后续可直接在数组末尾继续补充台词。
const BEAVER_SHOP_BEAVER_DIALOGUES = [
  "商店暂时不开放了，搬家以后我的道具都不值钱了，不过你可以随意逛逛。",
] as const;

const BEAVER_SHOP_ITEM_DIALOGUES = [
  {
    type: MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    text: "Dream Machine 车票暂时不出售，夜间列车现在可以直接前往。",
  },
  {
    type: MapEntityTypeId.SHOP_CLOUD9_TICKET,
    text: "Cloud 9 车票暂时不出售，夜间列车现在可以直接前往。",
  },
  {
    type: MapEntityTypeId.SHOP_STEREO_SYSTEM,
    text: "Stereo System 还没有接好，Sound Test 暂不开放。",
  },
  {
    type: MapEntityTypeId.SHOP_EXTRA_MUSIC,
    text: "Extra Music 还在重新整理，暂时只能听现有曲目。",
  },
  {
    type: MapEntityTypeId.SHOP_SPEED_SHOES,
    text: "新店的地板太滑，Speed Shoes 暂时不出售。",
  },
  {
    type: MapEntityTypeId.SHOP_COIN_RADAR,
    text: "搬家以后金币的位置全变了，Coin Radar 还在重新校准。",
  },
] as const;

const BEAVER_SHOP: AdventureAugmentation = {
  levelPatches: [
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.PORTAL,
        x: 11,
        y: 16,
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
      operation: "add",
      entity: {
        type: MapEntityTypeId.DREAM_MACHINE,
        x: 21,
        y: 8,
      },
    },
  ],
  interactions: [
    {
      id: "beaver-shop/beaver",
      selector: { type: MapEntityTypeId.BEAVER, action: "touch" },
      effect: {
        type: "dialogue",
        lines: BEAVER_SHOP_BEAVER_DIALOGUES,
      },
    },
    {
      id: "beaver-shop/dream-machine",
      selector: {
        type: MapEntityTypeId.DREAM_MACHINE,
        action: "touch",
        role: "body",
      },
      effect: {
        type: "dialogue",
        lines: ["哔哔~我从其他地方搞来了传送门，哔哔~"],
      },
    },
    {
      id: "beaver-shop/super-key",
      selector: { type: MapEntityTypeId.SHOP_SUPER_KEY, action: "touch" },
      effect: {
        type: "item-purchase",
        offer: {
          item: "golden-key",
          currency: "bonus-coins",
          price: 1,
          message: "也不知搬家以后钥匙能不能用了，你要的话1块钱收走吧",
          leftLabel: "购买",
          rightLabel: "算了",
          outcomeMessages: {
            "already-owned": "这把 Super Key 已经是你的了。",
            purchased: "成交，这把 Super Key 归你了。",
            "insufficient-funds": "金币不够，攒到1枚再来吧。",
          },
        },
      },
    },
    ...BEAVER_SHOP_ITEM_DIALOGUES.map<AdventureInteractionRule>((item) => ({
      id: `beaver-shop/${item.type}`,
      selector: { type: item.type, action: "touch" },
      effect: { type: "dialogue", lines: [item.text] },
    })),
  ],
};

const SPECIAL_SCENES: Readonly<Record<string, AdventureAugmentation>> = {
  "beaver-shop": BEAVER_SHOP,
  "dream-machine": {
    levelPatches: [],
    interactions: [
      {
        id: "dream-machine/beaver",
        selector: { type: MapEntityTypeId.BEAVER, action: "touch" },
        effect: {
          type: "dialogue",
          lines: ["Dream Machine 还在调试，我暂时不能让它启动。"],
        },
      },
      {
        id: "dream-machine/machine",
        selector: { type: MapEntityTypeId.DREAM_MACHINE, action: "touch" },
        effect: {
          type: "dialogue",
          lines: ["机器没有响应，Dream Machine 暂不开放。"],
        },
      },
    ],
  },
  "cloud-9": {
    levelPatches: [],
    interactions: [
      {
        id: "cloud-9/sandman",
        selector: { type: MapEntityTypeId.SANDMAN, action: "touch" },
        effect: {
          type: "dialogue",
          lines: ["Cloud 9 暂不开放，我还在整理这里的梦。"],
        },
      },
    ],
  },
  "dreamland-reward": {
    levelPatches: [],
    interactions: [
      {
        id: "dreamland-reward/sandman",
        selector: { type: MapEntityTypeId.SANDMAN, action: "touch" },
        effect: {
          type: "dialogue",
          lines: ["Dreamland Reward 暂不开放，奖励还在准备中。"],
        },
      },
    ],
  },
};

const BONUS_LEVEL_INTERACTIONS: readonly AdventureInteractionRule[] = [
  {
    id: "bonus/beaver-key-vendor",
    selector: { type: MapEntityTypeId.BEAVER, action: "touch" },
    effect: { type: "bonus-key-vendor", priceBonusCoins: 3 },
  },
];

/** 每张 Adventure 内容的补丁和运行时交互规则都从此目录读取。 */
export function adventureAugmentationFor(
  contentId: string,
): AdventureAugmentation {
  const scene = SPECIAL_SCENES[contentId];
  if (scene) return scene;
  if (parseAdventureLevelId(contentId)?.kind === "bonus") {
    return {
      levelPatches: [],
      interactions: BONUS_LEVEL_INTERACTIONS,
    };
  }
  return EMPTY_AUGMENTATION;
}
