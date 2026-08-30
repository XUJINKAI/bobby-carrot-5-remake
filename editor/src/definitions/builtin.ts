import { EntityTypeId, type Direction, type LevelEntity } from "@bobby/model";
import type {
  EditorDefinition,
  EditorEntityDefinition,
  EditorEntityVariant,
} from "./types.js";

const directions: readonly EditorEntityVariant[] = (["up", "right", "down", "left"] as const)
  .map((direction) => ({ direction }));

const pressedVariants: readonly EditorEntityVariant[] = [
  { state: { pressed: false } },
  { state: { pressed: true } },
];

const activeVariants: readonly EditorEntityVariant[] = [
  { state: { active: true } },
  { state: { active: false } },
];

const fourVariants: readonly EditorEntityVariant[] = [1, 2, 3, 4]
  .map((variant) => ({ state: { variant } }));

const directional: EditorEntityDefinition = {
  defaultDirection: "right",
  variants: directions,
};

export const builtinEditorDefinition: EditorDefinition = {
  entities: {
    [EntityTypeId.BOBBY]: {
      defaultDirection: "down",
      variants: directions,
      editorVisual: () => ({
        layers: [{
          kind: "image",
          asset: "bobby-down",
          frameColumns: 8,
          frameRows: 1,
          frameIndex: 7,
          anchor: "bottom",
          offsetY: -12,
        }],
      }),
    },
    [EntityTypeId.DRAGON]: {
      placementPoint: { role: "body" },
      defaultDirection: "right",
      variants: directions,
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
    [EntityTypeId.SPEED]: directional,
    [EntityTypeId.TIDE]: directional,
    [EntityTypeId.TIDE_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.SPEED_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.CAROUSEL_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.COLOR_YELLOW_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.COLOR_PINK_SWITCH]: { variants: pressedVariants },
    [EntityTypeId.TRAP]: { variants: activeVariants },
    [EntityTypeId.MIRROR]: { variants: fourVariants },
    [EntityTypeId.CAROUSEL]: { variants: fourVariants },
    [EntityTypeId.CONSUMED_CARROT]: { creatable: false },
    [EntityTypeId.PLANK_CRUMBLING]: { creatable: false },
    [EntityTypeId.PLANK_FRAGMENT]: { creatable: false },
    [EntityTypeId.BEAN_SPROUT]: { creatable: false },
  },
  palette: {
    groups: [
      {
        id: "terrain",
        label: "地形",
        rows: [[
          { type: EntityTypeId.GROUND_A }, { type: EntityTypeId.GROUND_B },
          { type: EntityTypeId.GROUND_C }, { type: EntityTypeId.GROUND_D },
          { type: EntityTypeId.ICE }, { type: EntityTypeId.SNOW },
          { type: EntityTypeId.WATER }, { type: EntityTypeId.WATER_ANIMATED },
        ]],
      },
      {
        id: "objective",
        label: "目标与收集",
        rows: [[
          { type: EntityTypeId.BOBBY }, { type: EntityTypeId.EXIT },
          { type: EntityTypeId.CARROT }, { type: EntityTypeId.EGG_NEST_EMPTY },
          { type: EntityTypeId.GOLDEN_CARROT }, { type: EntityTypeId.BONUS_COIN },
          { type: EntityTypeId.PUSH_GOAL },
        ]],
      },
      {
        id: "mechanism",
        label: "机关",
        rows: [
          directions.map((variant) => ({ type: EntityTypeId.SPEED, direction: variant.direction! })),
          directions.map((variant) => ({ type: EntityTypeId.TIDE, direction: variant.direction! })),
          [{ type: EntityTypeId.TRAP }, { type: EntityTypeId.MIRROR }, { type: EntityTypeId.CAROUSEL },
           { type: EntityTypeId.TIDE_SWITCH }, { type: EntityTypeId.SPEED_SWITCH }, { type: EntityTypeId.CAROUSEL_SWITCH }],
        ],
      },
      {
        id: "actors",
        label: "角色与对象",
        rows: [[
          { type: EntityTypeId.DRAGON }, { type: EntityTypeId.SANDMAN },
          { type: EntityTypeId.DREAM_MACHINE }, { type: EntityTypeId.BEAVER },
          { type: EntityTypeId.FENCE }, { type: EntityTypeId.ICE_BLOCK },
          { type: EntityTypeId.HIGH_GRASS }, { type: EntityTypeId.HIGH_GRASS_OBJECTIVE },
        ]],
      },
      {
        id: "items",
        label: "道具",
        rows: [[
          { type: EntityTypeId.BEAN }, { type: EntityTypeId.BEAN_FIELD },
          { type: EntityTypeId.SHOVEL_PICKUP }, { type: EntityTypeId.MOWER },
          { type: EntityTypeId.GAS }, { type: EntityTypeId.KITE },
          { type: EntityTypeId.LEAF }, { type: EntityTypeId.WHIRLWIND },
        ]],
      },
    ],
  },
  deletion: {
    resolveTarget({ candidates }) {
      return candidates.at(-1)?.ref ?? null;
    },
  },
};

export const EDITOR_DIRECTIONS: readonly Direction[] = ["up", "right", "down", "left"];

export function applyEditorVariant(
  entity: Readonly<LevelEntity>,
  variant: EditorEntityVariant,
): LevelEntity {
  return {
    ...structuredClone(entity),
    ...(variant.direction ? { direction: variant.direction } : {}),
    ...(variant.properties
      ? { properties: { ...(entity.properties ?? {}), ...structuredClone(variant.properties) } }
      : {}),
    ...(variant.state
      ? { state: { ...(entity.state ?? {}), ...structuredClone(variant.state) } }
      : {}),
  };
}
