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
  "商店还在装修中，不过你可以随意逛逛...",
  "话说，你知道我是怎么到这儿的吗？",
  "那天，突然出现了一个家伙，他说他叫 XUJINKAI，说是要给我搬家，然后不由分说就把我的店铺打包带走了...",
  "我都拦不住他，然后就稀里糊涂来到这儿了。",
  "不过那家伙不错，说是我的道具用处不大了，想帮我把商店改成展览馆。",
  "你说他不会是画饼吧...",
  "算了，你随便逛吧...",
] as const;

const BEAVER_SHOP_ITEM_DIALOGUES = [
  {
    type: MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    text: "陈列着 Dream Machine 车票，听说现在不需要买票了。",
  },
  {
    type: MapEntityTypeId.SHOP_CLOUD9_TICKET,
    text: "陈列着 Cloud 9 车票，听说现在不需要买票了。",
  },
  {
    type: MapEntityTypeId.SHOP_STEREO_SYSTEM,
    text: "陈列着 立体声系统，听说现在大家都用无线耳机了。",
  },
  {
    type: MapEntityTypeId.SHOP_EXTRA_MUSIC,
    text: "陈列着 附赠音乐，听说现在大家都喜欢在线听歌。",
  },
  {
    type: MapEntityTypeId.SHOP_SPEED_SHOES,
    text: "陈列着 速度鞋，现在似乎用不上了。",
  },
  {
    type: MapEntityTypeId.SHOP_COIN_RADAR,
    text: "陈列着 金币雷达，现在似乎用不上了。",
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
        lines: [
          "哔哔~我从其他地方搞来了传送门，哔哔~",
          "哔哔~我是勤奋的科研机器，哔哔~",
        ],
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
          lines: ["我还在调试设备。"],
        },
      },
      {
        id: "dream-machine/machine",
        selector: { type: MapEntityTypeId.DREAM_MACHINE, action: "touch" },
        effect: {
          type: "dialogue",
          lines: ["哔哔~你有见过我的兄弟吗？哔哔~"],
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
          lines: ["咳咳...我...我是怎么到这儿的..."],
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
          lines: ["咳咳...我...我是怎么到这儿的..."],
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
