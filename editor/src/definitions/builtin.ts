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

const surface: EditorEntityDefinition = { replaceGroup: "surface" };
const cover: EditorEntityDefinition = { replaceGroup: "cover" };
const item: EditorEntityDefinition = { replaceGroup: "item" };
const directionalSurface: EditorEntityDefinition = {
  ...surface,
  defaultDirection: "right",
  variants: directions,
};

const surfaceTypes: readonly EntityType[] = [
  EntityTypeId.GROUND_A,
  EntityTypeId.GROUND_B,
  EntityTypeId.GROUND_C,
  EntityTypeId.GROUND_D,
  EntityTypeId.START,
  EntityTypeId.SHOVEL_CLEARED_GROUND,
  EntityTypeId.EXIT,
  EntityTypeId.ICE,
  EntityTypeId.SHOP_DREAM,
  EntityTypeId.SHOP_CLOUD9,
  EntityTypeId.SHOP_SUPER_KEY,
  EntityTypeId.SHOP_STEREO,
  EntityTypeId.SHOP_MUSIC,
  EntityTypeId.SHOP_SPEED_SHOES,
  EntityTypeId.SHOP_COIN_RADAR,
  EntityTypeId.SHOP_UNAVAILABLE,
  EntityTypeId.SHOVEL_PICKUP,
  EntityTypeId.MOWER_PARKING,
  EntityTypeId.WATER,
  EntityTypeId.WATER_ANIMATED,
  EntityTypeId.WATER_VARIANT_1,
  EntityTypeId.WATER_VARIANT_2,
  EntityTypeId.WATER_VARIANT_3,
  EntityTypeId.SPEED,
  EntityTypeId.TIDE,
  EntityTypeId.TIDE_SWITCH,
  EntityTypeId.SPEED_SWITCH,
  EntityTypeId.CAROUSEL_SWITCH,
  EntityTypeId.COLOR_YELLOW_SWITCH,
  EntityTypeId.COLOR_PINK_SWITCH,
  EntityTypeId.COLOR_YELLOW_BLOCK,
  EntityTypeId.COLOR_PINK_BLOCK,
  EntityTypeId.TRAP,
  EntityTypeId.MIRROR,
  EntityTypeId.CAROUSEL,
  EntityTypeId.WIND_SWITCH,
  EntityTypeId.PUSH_GOAL,
];

export const builtinEditorDefinition: EditorDefinition = {
  exclude: [
    EntityTypeId.CONSUMED_CARROT,
    EntityTypeId.PLANK_CRUMBLING,
    EntityTypeId.PLANK_FRAGMENT,
    EntityTypeId.BEAN_SPROUT,
    { prefix: "background-variant-" },
    { prefix: "walkable-variant-" },
    { prefix: "object-variant-" },
  ],
  entities: {
    ...withPolicy(surfaceTypes, surface),
    ...withPolicy(
      [EntityTypeId.SNOW, EntityTypeId.HIGH_GRASS, EntityTypeId.HIGH_GRASS_OBJECTIVE, EntityTypeId.ICE_BLOCK],
      cover,
    ),
    ...withPolicy(
      [EntityTypeId.CARROT, EntityTypeId.EGG_NEST_EMPTY, EntityTypeId.EGG_NEST_FILLED],
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
    [EntityTypeId.SPEED]: directionalSurface,
    [EntityTypeId.TIDE]: directionalSurface,
    [EntityTypeId.TIDE_SWITCH]: { ...surface, variants: pressedVariants },
    [EntityTypeId.SPEED_SWITCH]: { ...surface, variants: pressedVariants },
    [EntityTypeId.CAROUSEL_SWITCH]: { ...surface, variants: pressedVariants },
    [EntityTypeId.COLOR_YELLOW_SWITCH]: { ...surface, variants: pressedVariants },
    [EntityTypeId.COLOR_PINK_SWITCH]: { ...surface, variants: pressedVariants },
    [EntityTypeId.COLOR_YELLOW_BLOCK]: { ...surface, variants: raisedVariants },
    [EntityTypeId.COLOR_PINK_BLOCK]: { ...surface, variants: raisedVariants },
    [EntityTypeId.WIND_SWITCH]: { ...surface, variants: windSwitchVariants },
    [EntityTypeId.TRAP]: { ...surface, variants: activeVariants },
    [EntityTypeId.MIRROR]: { ...surface, variants: fourVariants },
    [EntityTypeId.CAROUSEL]: { ...surface, variants: carouselVariants },
  },
  palette: {
    groups: [
      {
        id: "terrain",
        label: "地形",
        rows: [
          [
            { type: EntityTypeId.GROUND_A },
            { type: EntityTypeId.GROUND_B },
            { type: EntityTypeId.GROUND_C },
            { type: EntityTypeId.GROUND_D },
            { type: EntityTypeId.ICE },
            { type: EntityTypeId.SNOW },
            { type: EntityTypeId.WATER },
            { type: EntityTypeId.WATER_ANIMATED },
          ],
        ],
      },
      {
        id: "objective",
        label: "目标与收集",
        rows: [
          [
            { type: EntityTypeId.BOBBY },
            { type: EntityTypeId.EXIT },
            { type: EntityTypeId.CARROT },
            { type: EntityTypeId.EGG_NEST_EMPTY },
            { type: EntityTypeId.GOLDEN_CARROT },
            { type: EntityTypeId.BONUS_COIN },
            { type: EntityTypeId.PUSH_GOAL },
          ],
        ],
      },
      {
        id: "mechanism",
        label: "机关",
        rows: [
          directions.map((variant) => ({
            type: EntityTypeId.SPEED,
            direction: variant.direction!,
          })),
          directions.map((variant) => ({
            type: EntityTypeId.TIDE,
            direction: variant.direction!,
          })),
          [
            { type: EntityTypeId.TRAP },
            { type: EntityTypeId.MIRROR },
            { type: EntityTypeId.CAROUSEL },
            { type: EntityTypeId.TIDE_SWITCH },
            { type: EntityTypeId.SPEED_SWITCH },
            { type: EntityTypeId.CAROUSEL_SWITCH },
          ],
          [
            { type: EntityTypeId.COLOR_YELLOW_SWITCH },
            { type: EntityTypeId.COLOR_PINK_SWITCH },
            { type: EntityTypeId.COLOR_YELLOW_BLOCK },
            { type: EntityTypeId.COLOR_PINK_BLOCK },
            { type: EntityTypeId.WIND_SWITCH },
          ],
        ],
      },
      {
        id: "actors",
        label: "角色与对象",
        rows: [
          [
            { type: EntityTypeId.DRAGON },
            { type: EntityTypeId.SANDMAN },
            { type: EntityTypeId.DREAM_MACHINE },
            { type: EntityTypeId.BEAVER },
            { type: EntityTypeId.FENCE },
            { type: EntityTypeId.ICE_BLOCK },
            { type: EntityTypeId.HIGH_GRASS },
            { type: EntityTypeId.HIGH_GRASS_OBJECTIVE },
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
            { type: EntityTypeId.SHOVEL_PICKUP },
            { type: EntityTypeId.MOWER },
            { type: EntityTypeId.GAS },
            { type: EntityTypeId.KITE },
            { type: EntityTypeId.LEAF },
            { type: EntityTypeId.WHIRLWIND },
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
