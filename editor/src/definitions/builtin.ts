import {
  EntityTypeId,
  type Direction,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import type {
  EditorDefinition,
  EditorEntityDefinition,
  EditorEntityVariant,
} from "./types.js";
import {
  playerPresenceValidator,
  reachTargetValidator,
  registeredEntityTypesValidator,
} from "./validators.js";

const directions: readonly EditorEntityVariant[] = (
  ["up", "right", "down", "left"] as const
).map((direction) => ({ direction, label: direction }));

const horizontalDirections: readonly EditorEntityVariant[] = [
  { direction: "left", label: "left" },
  { direction: "right", label: "right" },
];
const pressedVariants: readonly EditorEntityVariant[] = [
  { label: "Raised", state: { pressed: false } },
  { label: "Pressed", state: { pressed: true } },
];
const activeVariants: readonly EditorEntityVariant[] = [
  { label: "Active", state: { active: true } },
  { label: "Inactive", state: { active: false } },
];
const windSwitchVariants: readonly EditorEntityVariant[] = [
  { label: "On", state: { active: true } },
  { label: "Off", state: { active: false } },
];
const raisedVariants: readonly EditorEntityVariant[] = [
  { label: "Raised", state: { raised: true } },
  { label: "Lowered", state: { raised: false } },
];
const fourVariants: readonly EditorEntityVariant[] = [1, 2, 3, 4].map(
  (variant) => ({ label: String(variant), state: { variant } }),
);
const carouselVariants: readonly EditorEntityVariant[] = [
  ...fourVariants,
  { label: "Vertical", state: { variant: "vertical" } },
  { label: "Horizontal", state: { variant: "horizontal" } },
];

const cover: EditorEntityDefinition = { replaceGroup: "cover" };
const item: EditorEntityDefinition = { replaceGroup: "item" };
const directionalMechanism: EditorEntityDefinition = {
  defaultDirection: "right",
  variants: directions,
};

export const builtinEditorDefinition: EditorDefinition = {
  exclude: [
    EntityTypeId.CONSUMED_CARROT,
    EntityTypeId.PLANK_CRUMBLING,
    EntityTypeId.PLANK_FRAGMENT,
    EntityTypeId.BEAN_SPROUT,
    EntityTypeId.FENCE,
    { prefix: "background-variant-" },
    { prefix: "walkable-variant-" },
    { prefix: "object-variant-" },
  ],
  entities: {
    ...withPolicy(
      [
        EntityTypeId.SNOW,
        EntityTypeId.HIGH_GRASS,
        EntityTypeId.HIGH_GRASS_OBJECTIVE,
        EntityTypeId.ICE_BLOCK,
      ],
      cover,
    ),
    ...withPolicy(
      [
        EntityTypeId.CARROT,
        EntityTypeId.EGG_NEST_EMPTY,
        EntityTypeId.EGG_NEST_FILLED,
      ],
      item,
    ),
    [EntityTypeId.BOBBY]: {
      defaultDirection: "down",
      variants: directions,
      editorVisual: () => ({
        layers: [
          {
            kind: "image",
            asset: "bobby-down",
            frameColumns: 8,
            frameRows: 1,
            frameIndex: 7,
            anchor: "bottom",
            offsetY: -12,
          },
        ],
      }),
    },
    [EntityTypeId.DRAGON]: {
      placementPoint: { role: "body" },
      defaultDirection: "left",
      variants: horizontalDirections,
    },
    [EntityTypeId.SANDMAN]: {
      placementPoint: { role: "body" },
      defaultDirection: "down",
      variants: directions,
    },
    [EntityTypeId.DREAM_MACHINE]: {
      placementPoint: { role: "body" },
      defaultDirection: "down",
      variants: directions,
    },
    [EntityTypeId.BEAVER]: {
      placementPoint: { role: "body" },
      defaultDirection: "down",
      variants: directions,
    },
    [EntityTypeId.SPEED]: directionalMechanism,
    [EntityTypeId.TIDE]: directionalMechanism,
    [EntityTypeId.TIDE_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.SPEED_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.CAROUSEL_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.COLOR_YELLOW_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.COLOR_PINK_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.COLOR_YELLOW_BLOCK]: { variants: raisedVariants },
    [EntityTypeId.COLOR_PINK_BLOCK]: { variants: raisedVariants },
    [EntityTypeId.WIND_SWITCH]: { variants: windSwitchVariants },
    [EntityTypeId.TRAP]: { variants: activeVariants },
    [EntityTypeId.MIRROR]: { variants: fourVariants },
    [EntityTypeId.CAROUSEL]: { variants: carouselVariants },
  },
  palette: {
    groups: [
      {
        id: "terrain-overlays",
        label: "地貌对象",
        rows: [
          [
            { type: EntityTypeId.CRUMBLY_ROCK },
            { type: EntityTypeId.HIGH_GRASS },
            { type: EntityTypeId.HIGH_GRASS_OBJECTIVE },
            { type: EntityTypeId.SNOW },
            { type: EntityTypeId.PLANK },
            { type: EntityTypeId.LEAF },
          ],
        ],
      },
      {
        id: "actors",
        label: "玩家与人物",
        rows: [
          [
            { type: EntityTypeId.BOBBY },
            { type: EntityTypeId.SANDMAN },
            { type: EntityTypeId.DREAM_MACHINE },
            { type: EntityTypeId.BEAVER },
          ],
        ],
      },
      {
        id: "objective",
        label: "目标与收集",
        rows: [
          [
            { type: EntityTypeId.START },
            { type: EntityTypeId.EXIT },
            { type: EntityTypeId.CARROT },
            { type: EntityTypeId.EGG_NEST_EMPTY },
            { type: EntityTypeId.EGG_NEST_FILLED },
            { type: EntityTypeId.PUSH_GOAL },
          ],
          [
            { type: EntityTypeId.GOLDEN_CARROT },
            { type: EntityTypeId.BONUS_COIN },
          ],
          [
            { type: EntityTypeId.SHOP_CLOUD9 },
            { type: EntityTypeId.SHOP_COIN_RADAR },
            { type: EntityTypeId.SHOP_DREAM },
            { type: EntityTypeId.SHOP_MUSIC },
            { type: EntityTypeId.SHOP_SPEED_SHOES },
            { type: EntityTypeId.SHOP_STEREO },
            { type: EntityTypeId.SHOP_SUPER_KEY },
            { type: EntityTypeId.SHOP_UNAVAILABLE },
            { type: EntityTypeId.LOCK },
          ],
        ],
      },
      {
        id: "items",
        label: "道具",
        rows: [
          [
            { type: EntityTypeId.BEAN },
            { type: EntityTypeId.BEAN_FIELD },
            { type: EntityTypeId.GAS },
            { type: EntityTypeId.MOWER },
            { type: EntityTypeId.MOWER_PARKING },
            { type: EntityTypeId.SHOVEL_PICKUP },
            { type: EntityTypeId.KITE },
            { type: EntityTypeId.WHIRLWIND },
            { type: EntityTypeId.LANDING },
          ],
        ],
      },
      {
        id: "mechanism",
        label: "机关",
        rows: [
          [
            ...directions.map((variant) => ({
              type: EntityTypeId.SPEED,
              direction: variant.direction!,
            })),
            { type: EntityTypeId.SPEED_SWITCH },
          ],
          [
            ...directions.map((variant) => ({
              type: EntityTypeId.TIDE,
              direction: variant.direction!,
            })),
            { type: EntityTypeId.TIDE_SWITCH },
          ],
          [
            { type: EntityTypeId.COLOR_YELLOW_SWITCH },
            { type: EntityTypeId.COLOR_PINK_SWITCH },
            { type: EntityTypeId.COLOR_YELLOW_BLOCK },
            { type: EntityTypeId.COLOR_PINK_BLOCK },
            { type: EntityTypeId.TRAP },
          ],
          [
            { type: EntityTypeId.MIRROR },
            { type: EntityTypeId.CAROUSEL },
            { type: EntityTypeId.CAROUSEL_SWITCH },
          ],
          [
            { type: EntityTypeId.DRAGON },
            { type: EntityTypeId.ICE_BLOCK },
            { type: EntityTypeId.PORTAL },
          ],
          [
            { type: EntityTypeId.WINDMILL_DOWN },
            { type: EntityTypeId.WINDMILL_UP },
            { type: EntityTypeId.WINDMILL_LEFT },
            { type: EntityTypeId.WINDMILL_RIGHT },
            { type: EntityTypeId.WIND_SWITCH },
            { type: EntityTypeId.CLOUD_GREEN },
            { type: EntityTypeId.CLOUD_PURPLE },
            { type: EntityTypeId.CLOUD_RED },
            { type: EntityTypeId.CLOUD_GRID_GREEN },
            { type: EntityTypeId.CLOUD_GRID_PURPLE },
            { type: EntityTypeId.CLOUD_GRID_RED },
          ],
        ],
      },
    ],
  },
  validators: [
    registeredEntityTypesValidator,
    playerPresenceValidator,
    reachTargetValidator,
  ],
  deletion: {
    resolveTarget({ candidates }) {
      return candidates.at(-1)?.ref ?? null;
    },
  },
};

export const EDITOR_DIRECTIONS: readonly Direction[] = [
  "up",
  "right",
  "down",
  "left",
];

export function applyEditorVariant(
  entity: Readonly<LevelEntity>,
  variant: EditorEntityVariant,
): LevelEntity {
  return {
    ...structuredClone(entity),
    ...(variant.direction ? { direction: variant.direction } : {}),
    ...(variant.properties
      ? {
          properties: {
            ...(entity.properties ?? {}),
            ...structuredClone(variant.properties),
          },
        }
      : {}),
    ...(variant.state
      ? {
          state: {
            ...(entity.state ?? {}),
            ...structuredClone(variant.state),
          },
        }
      : {}),
  };
}

function withPolicy(
  types: readonly EntityType[],
  policy: EditorEntityDefinition,
): Partial<Record<EntityType, EditorEntityDefinition>> {
  return Object.fromEntries(types.map((type) => [type, policy]));
}
