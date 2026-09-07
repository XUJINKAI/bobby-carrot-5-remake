import {
  EntityTypeId,
  MapEntityTypeId,
  SURFACE_ENTITY_DEFINITIONS,
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
  requiredEntityFieldsValidator,
} from "./validators.js";

const directions: readonly EditorEntityVariant[] = (
  ["up", "right", "down", "left"] as const
).map((direction) => ({ direction, label: direction }));

const horizontalDirections: readonly EditorEntityVariant[] = [
  { direction: "left", label: "left" },
  { direction: "right", label: "right" },
];
const pressedVariants: readonly EditorEntityVariant[] = [
  { label: "Raised", fields: { pressed: false } },
  { label: "Pressed", fields: { pressed: true } },
];
const activeVariants: readonly EditorEntityVariant[] = [
  { label: "Active", fields: { active: true } },
  { label: "Inactive", fields: { active: false } },
];
const windSwitchVariants: readonly EditorEntityVariant[] = [
  { label: "On", fields: { active: true } },
  { label: "Off", fields: { active: false } },
];
const colorSwitchVariants: readonly EditorEntityVariant[] = [
  { label: "Yellow Raised", fields: { color: "yellow", pressed: false } },
  { label: "Yellow Pressed", fields: { color: "yellow", pressed: true } },
  { label: "Pink Raised", fields: { color: "pink", pressed: false } },
  { label: "Pink Pressed", fields: { color: "pink", pressed: true } },
];
const colorBlockVariants: readonly EditorEntityVariant[] = [
  { label: "Yellow Raised", fields: { color: "yellow", raised: true } },
  { label: "Yellow Lowered", fields: { color: "yellow", raised: false } },
  { label: "Pink Raised", fields: { color: "pink", raised: true } },
  { label: "Pink Lowered", fields: { color: "pink", raised: false } },
];
const fourVariants: readonly EditorEntityVariant[] = [1, 2, 3, 4].map(
  (variant) => ({ label: String(variant), fields: { variant } }),
);
const carouselVariants: readonly EditorEntityVariant[] = [
  ...fourVariants,
  { label: "Vertical", fields: { variant: "vertical" } },
  { label: "Horizontal", fields: { variant: "horizontal" } },
];

const surface: EditorEntityDefinition = { replaceGroup: "surface" };
const cover: EditorEntityDefinition = { replaceGroup: "cover" };
const item: EditorEntityDefinition = { replaceGroup: "item" };
const directionalMechanism: EditorEntityDefinition = {
  defaultDirection: "right",
  variants: directions,
};
const directSurfaceTypes: readonly EntityType[] = [
  ...SURFACE_ENTITY_DEFINITIONS.map((definition) => definition.type),
  EntityTypeId.GROUND_A,
  EntityTypeId.GROUND_B,
  EntityTypeId.GROUND_C,
  EntityTypeId.GROUND_D,
  EntityTypeId.ICE,
  EntityTypeId.WATER,
  EntityTypeId.WATER_ANIMATED,
  EntityTypeId.WATER_VARIANT_1,
  EntityTypeId.WATER_VARIANT_2,
  EntityTypeId.WATER_VARIANT_3,
];

export const builtinEditorDefinition: EditorDefinition = {
  exclude: [
    EntityTypeId.GROUND_A,
    EntityTypeId.GROUND_B,
    EntityTypeId.GROUND_C,
    EntityTypeId.GROUND_D,
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
    ...withPolicy(directSurfaceTypes, surface),
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
    },
    [EntityTypeId.DREAM_MACHINE]: {
      placementPoint: { role: "body" },
    },
    [EntityTypeId.BEAVER]: {
      placementPoint: { role: "body" },
    },
    [EntityTypeId.SPEED]: directionalMechanism,
    [EntityTypeId.TIDE]: directionalMechanism,
    [EntityTypeId.TIDE_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.SPEED_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.CAROUSEL_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.COLOR_SWITCH]: { variants: colorSwitchVariants },
    [EntityTypeId.COLOR_BLOCK]: { variants: colorBlockVariants },
    [EntityTypeId.WIND_SWITCH]: {
      defaultDirection: "up",
      variants: windSwitchVariants,
    },
    [EntityTypeId.TRAP]: { variants: activeVariants },
    [EntityTypeId.MIRROR]: { variants: fourVariants },
    [EntityTypeId.CAROUSEL]: { variants: carouselVariants },
    [EntityTypeId.PORTAL]: {
      variants: ["blue", "red", "green"].map((channel) => ({
        label: channel,
        fields: { channel },
      })),
    },
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
            { type: MapEntityTypeId.PUSHABLE_ROCK },
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
            {
              type: EntityTypeId.COLOR_SWITCH,
              label: "Yellow Switch",
              fields: { color: "yellow" },
            },
            {
              type: EntityTypeId.COLOR_SWITCH,
              label: "Pink Switch",
              fields: { color: "pink" },
            },
            {
              type: EntityTypeId.COLOR_BLOCK,
              label: "Yellow Block",
              fields: { color: "yellow" },
            },
            {
              type: EntityTypeId.COLOR_BLOCK,
              label: "Pink Block",
              fields: { color: "pink" },
            },
            { type: EntityTypeId.TRAP },
          ],
          [
            { type: EntityTypeId.MIRROR, fields: { variant: 1 } },
            { type: EntityTypeId.CAROUSEL, fields: { variant: 1 } },
            { type: EntityTypeId.CAROUSEL_SWITCH },
          ],
          [
            { type: EntityTypeId.DRAGON },
            { type: EntityTypeId.ICE_BLOCK },
            { type: EntityTypeId.PORTAL, fields: { channel: "blue" } },
          ],
          [
            { type: EntityTypeId.WINDMILL_DOWN },
            { type: EntityTypeId.WINDMILL_UP },
            { type: EntityTypeId.WINDMILL_LEFT },
            { type: EntityTypeId.WINDMILL_RIGHT },
            { type: EntityTypeId.WIND_SWITCH, direction: "up" },
            {
              type: EntityTypeId.CLOUD,
              label: "Green Cloud",
              fields: { color: "green" },
            },
            {
              type: EntityTypeId.CLOUD,
              label: "Purple Cloud",
              fields: { color: "purple" },
            },
            {
              type: EntityTypeId.CLOUD,
              label: "Red Cloud",
              fields: { color: "red" },
            },
            {
              type: EntityTypeId.CLOUD_PARKING,
              label: "Green Cloud Parking",
              fields: { color: "green" },
            },
            {
              type: EntityTypeId.CLOUD_PARKING,
              label: "Purple Cloud Parking",
              fields: { color: "purple" },
            },
            {
              type: EntityTypeId.CLOUD_PARKING,
              label: "Red Cloud Parking",
              fields: { color: "red" },
            },
          ],
        ],
      },
    ],
  },
  validators: [
    registeredEntityTypesValidator,
    requiredEntityFieldsValidator,
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
    ...(variant.fields ? structuredClone(variant.fields) : {}),
    ...(variant.direction ? { direction: variant.direction } : {}),
  };
}

function withPolicy(
  types: readonly EntityType[],
  policy: EditorEntityDefinition,
): Partial<Record<EntityType, EditorEntityDefinition>> {
  return Object.fromEntries(types.map((type) => [type, policy]));
}
