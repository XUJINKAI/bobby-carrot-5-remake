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
    type: MapEntityTypeId.SHOP_SUPER_KEY,
    text: "搬家以后锁都换了，这把 Super Key 暂时派不上用场。",
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
  ],
  interactions: [
    {
      selector: { type: MapEntityTypeId.BEAVER, action: "touch" },
      effect: {
        type: "dialogue",
        text: "商店暂时不开放了，搬家以后我的道具都不值钱了，不过你可以随意逛逛。",
      },
    },
    ...BEAVER_SHOP_ITEM_DIALOGUES.map<AdventureInteractionRule>((item) => ({
      selector: { type: item.type, action: "enter" },
      effect: { type: "dialogue", text: item.text },
    })),
  ],
};

const SPECIAL_SCENES: Readonly<Record<string, AdventureAugmentation>> = {
  "beaver-shop": BEAVER_SHOP,
  "dream-machine": {
    levelPatches: [],
    interactions: [
      {
        selector: { type: MapEntityTypeId.BEAVER, action: "touch" },
        effect: {
          type: "dialogue",
          text: "Dream Machine 还在调试，我暂时不能让它启动。",
        },
      },
      {
        selector: { type: MapEntityTypeId.DREAM_MACHINE, action: "touch" },
        effect: {
          type: "dialogue",
          text: "机器没有响应，Dream Machine 暂不开放。",
        },
      },
    ],
  },
  "cloud-9": {
    levelPatches: [],
    interactions: [
      {
        selector: { type: MapEntityTypeId.SANDMAN, action: "touch" },
        effect: {
          type: "dialogue",
          text: "Cloud 9 暂不开放，我还在整理这里的梦。",
        },
      },
    ],
  },
  "dreamland-reward": {
    levelPatches: [],
    interactions: [
      {
        selector: { type: MapEntityTypeId.SANDMAN, action: "touch" },
        effect: {
          type: "dialogue",
          text: "Dreamland Reward 暂不开放，奖励还在准备中。",
        },
      },
    ],
  },
};

const BONUS_LEVEL_INTERACTIONS: readonly AdventureInteractionRule[] = [
  {
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
