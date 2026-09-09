import {
  MapEntityTypeId,
  originalTileVisualGroups,
  type EntityType,
} from "@bobby/model";
import type { EditorPaletteDefinition } from "./types.js";

const originalPaletteTypes: readonly EntityType[] = originalTileVisualGroups(
  "palette",
).map((group) => group.type);

/**
 * Builtin Palette 是纯布局与展示表。
 * 同一 type 需要自定义顺序或外观时写多个显式条目；需要采用 Entity variants 的完整顺序时
 * 使用 expand: "variants"。
 */
export const BUILTIN_PALETTE_DEFINITION: EditorPaletteDefinition = {
  groups: [
    {
      id: "objective",
      label: "目标及道具",
      rows: [
        [
          { type: MapEntityTypeId.BOBBY },
          { type: MapEntityTypeId.EXIT },
          { type: MapEntityTypeId.CARROT },
          {
            type: MapEntityTypeId.EGG,
            preview: { state: { filled: true } },
          },
        ],
        [
          { type: MapEntityTypeId.GAS },
          { type: MapEntityTypeId.MOWER },
          { type: MapEntityTypeId.MOWER_PARKING },
          { type: MapEntityTypeId.CRUMBLY_ROCK },
          { type: MapEntityTypeId.HIGH_GRASS },
          { type: MapEntityTypeId.BEAN },
          { type: MapEntityTypeId.BEAN_FIELD },
          { type: MapEntityTypeId.SHOVEL_PICKUP },
          { type: MapEntityTypeId.SNOW },
          { type: MapEntityTypeId.KITE },
          { type: MapEntityTypeId.WHIRLWIND },
          { type: MapEntityTypeId.LANDING },
        ],
        [
          { type: MapEntityTypeId.PUSH_GOAL },
          { type: MapEntityTypeId.PUSHABLE_ROCK },
        ],
      ],
    },
    {
      id: "mechanism",
      label: "机关",
      rows: [
        [
          { type: MapEntityTypeId.SPEED, expand: "variants" },
          { type: MapEntityTypeId.SPEED_SWITCH, expand: "variants" },
        ],
        [
          { type: MapEntityTypeId.TIDE, expand: "variants" },
          { type: MapEntityTypeId.TIDE_SWITCH, expand: "variants" },
        ],
        [
          { type: MapEntityTypeId.COLOR_SWITCH, expand: "variants" },
          { type: MapEntityTypeId.COLOR_BLOCK, expand: "variants" },
          { type: MapEntityTypeId.TRAP, expand: "variants" },
        ],
        [
          { type: MapEntityTypeId.MIRROR, expand: "variants" },
          { type: MapEntityTypeId.CAROUSEL, expand: "variants" },
          { type: MapEntityTypeId.CAROUSEL_SWITCH, expand: "variants" },
        ],
        [
          { type: MapEntityTypeId.DRAGON },
          { type: MapEntityTypeId.ICE_BLOCK },
        ],
        [
          { type: MapEntityTypeId.WINDMILL, expand: "variants" },
          { type: MapEntityTypeId.WIND_SWITCH, expand: "variants" },
          { type: MapEntityTypeId.CLOUD, expand: "variants" },
          { type: MapEntityTypeId.CLOUD_PARKING, expand: "variants" },
          { type: MapEntityTypeId.PLANK },
          { type: MapEntityTypeId.LEAF },
          { type: MapEntityTypeId.PORTAL, fields: { channel: "blue" } },
        ],
      ],
    },
    {
      id: "shop",
      label: "商店",
      rows: [
        [
          { type: MapEntityTypeId.BEAVER },
          { type: MapEntityTypeId.SANDMAN },
          { type: MapEntityTypeId.DREAM_MACHINE },
          { type: MapEntityTypeId.SHOP_CLOUD9_TICKET },
          { type: MapEntityTypeId.SHOP_COIN_RADAR },
          { type: MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET },
          { type: MapEntityTypeId.SHOP_EXTRA_MUSIC },
          { type: MapEntityTypeId.SHOP_SPEED_SHOES },
          { type: MapEntityTypeId.SHOP_STEREO_SYSTEM },
          { type: MapEntityTypeId.SHOP_SUPER_KEY },
          { type: MapEntityTypeId.LOCK },
          { type: MapEntityTypeId.GOLDEN_CARROT },
          { type: MapEntityTypeId.BONUS_COIN },
          { type: MapEntityTypeId.START },
          { type: MapEntityTypeId.SHOP_EMPTY },
        ],
      ],
    },
  ],
  remainders: [
    {
      id: "original-tile-catalog",
      label: "Original Tile",
      types: originalPaletteTypes,
      expand: "variants",
      rows: "by-type",
    },
    {
      id: "ungrouped",
      label: "未分组",
      sort: "type",
      rows: "single",
    },
  ],
};
