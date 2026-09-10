import {
  MapEntityTypeId,
  SURFACE_ENTITY_DEFINITIONS,
  originalTileVisualGroup,
  type Direction,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import type {
  EditorDefinition,
  EditorEntityDefinition,
  EditorEntityVariant,
  EditorStackingDefinition,
} from "./types.js";
import { BUILTIN_PALETTE_DEFINITION } from "./palette.js";
import {
  playerPresenceValidator,
  reachTargetValidator,
  registeredEntityTypesValidator,
  requiredEntityFieldsValidator,
} from "./validators.js";

const editorDirections = ["up", "right", "down", "left"] as const;
const directions: readonly EditorEntityVariant[] = editorDirections.map(
  (direction) => ({ fields: { direction }, label: direction }),
);

const horizontalDirections: readonly EditorEntityVariant[] = [
  { fields: { direction: "right" }, label: "right" },
  { fields: { direction: "left" }, label: "left" },
];
const cornerVariants: readonly EditorEntityVariant[] = [
  { fields: { variant: "right-top" }, label: "rt" },
  { fields: { variant: "right-bottom" }, label: "rb" },
  { fields: { variant: "left-bottom" }, label: "lb" },
  { fields: { variant: "left-top" }, label: "lt" },
];
const carouselVariants: readonly EditorEntityVariant[] = [
  ...cornerVariants,
  { fields: { variant: "vertical" }, label: "vertical" },
  { fields: { variant: "horizontal" }, label: "horizontal" },
];
const windSwitchVariants: readonly EditorEntityVariant[] = editorDirections.map(
  (direction) => ({
    fields: { direction, active: false },
    label: direction,
  }),
);

const surfaceBase: EditorEntityDefinition = { stackSlot: "surface-base" };
const surfaceOverlay: EditorEntityDefinition = {
  stackSlot: "surface-overlay",
};
const floorFeature: EditorEntityDefinition = { stackSlot: "floor-feature" };
const content: EditorEntityDefinition = { stackSlot: "content" };
const support: EditorEntityDefinition = { stackSlot: "support" };
const occupant: EditorEntityDefinition = { stackSlot: "occupant" };
const cover: EditorEntityDefinition = { stackSlot: "cover" };
const directSurfaceTypes: readonly EntityType[] = [
  ...SURFACE_ENTITY_DEFINITIONS.map((definition) => definition.type),
];
const paletteFloorFeatureTypes: readonly EntityType[] = [
  MapEntityTypeId.EXIT,
  MapEntityTypeId.MOWER_PARKING,
  MapEntityTypeId.LANDING,
  MapEntityTypeId.PUSH_GOAL,
  MapEntityTypeId.SPEED,
  MapEntityTypeId.SPEED_SWITCH,
  MapEntityTypeId.TIDE,
  MapEntityTypeId.TIDE_SWITCH,
  MapEntityTypeId.COLOR_SWITCH,
  MapEntityTypeId.COLOR_BLOCK,
  MapEntityTypeId.CAROUSEL,
  MapEntityTypeId.CAROUSEL_SWITCH,
  MapEntityTypeId.MIRROR,
  MapEntityTypeId.WIND_SWITCH,
  MapEntityTypeId.CLOUD_PARKING,
  MapEntityTypeId.TRAP,
  MapEntityTypeId.PORTAL,
  MapEntityTypeId.SHOP_CLOUD9_TICKET,
  MapEntityTypeId.SHOP_COIN_RADAR,
  MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
  MapEntityTypeId.SHOP_EXTRA_MUSIC,
  MapEntityTypeId.SHOP_SPEED_SHOES,
  MapEntityTypeId.SHOP_STEREO_SYSTEM,
  MapEntityTypeId.SHOP_SUPER_KEY,
  MapEntityTypeId.START,
  MapEntityTypeId.SHOP_EMPTY,
];
const paletteContentTypes: readonly EntityType[] = [
  MapEntityTypeId.CARROT,
  MapEntityTypeId.EGG,
  MapEntityTypeId.GAS,
  MapEntityTypeId.BEAN,
  MapEntityTypeId.SHOVEL_PICKUP,
  MapEntityTypeId.KITE,
  MapEntityTypeId.GOLDEN_CARROT,
  MapEntityTypeId.BONUS_COIN,
];
const paletteSupportTypes: readonly EntityType[] = [
  MapEntityTypeId.MOWER,
  MapEntityTypeId.CLOUD,
  MapEntityTypeId.PLANK,
  MapEntityTypeId.LEAF,
];
const paletteOccupantTypes: readonly EntityType[] = [
  MapEntityTypeId.BOBBY,
  MapEntityTypeId.CRUMBLY_ROCK,
  MapEntityTypeId.BEAN_FIELD,
  MapEntityTypeId.WHIRLWIND,
  MapEntityTypeId.PUSHABLE_BOX,
  MapEntityTypeId.DRAGON,
  MapEntityTypeId.WINDMILL,
  MapEntityTypeId.BEAVER,
  MapEntityTypeId.SANDMAN,
  MapEntityTypeId.DREAM_MACHINE,
  MapEntityTypeId.LOCK,
];
const compatibleSlots: EditorStackingDefinition["compatibleSlots"] = [
  ["surface-base", "surface-overlay"],
  ["surface-base", "floor-feature"],
  ["surface-base", "content"],
  ["surface-base", "support"],
  ["surface-base", "occupant"],
  ["surface-base", "cover"],
  ["floor-feature", "content"],
  ["floor-feature", "support"],
  ["floor-feature", "occupant"],
  ["content", "cover"],
  ["support", "occupant"],
];
export const builtinEditorDefinition: EditorDefinition = {
  entities: {
    ...withPolicy(
      directSurfaceTypes.filter((type) => type !== MapEntityTypeId.FENCE),
      surfaceBase,
    ),
    [MapEntityTypeId.FENCE]: surfaceOverlay,
    ...withPolicy(paletteFloorFeatureTypes, floorFeature),
    ...withPolicy(paletteContentTypes, content),
    ...withPolicy(paletteSupportTypes, support),
    ...withPolicy(paletteOccupantTypes, occupant),
    ...withPolicy(
      [
        MapEntityTypeId.SNOW,
        MapEntityTypeId.HIGH_GRASS,
        MapEntityTypeId.ICE_BLOCK,
      ],
      cover,
    ),
    [MapEntityTypeId.BOBBY]: {
      ...occupant,
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
    [MapEntityTypeId.DRAGON]: {
      ...occupant,
      placementPoint: { role: "body" },
      defaultFields: { direction: "left" },
      variants: horizontalDirections,
    },
    [MapEntityTypeId.SANDMAN]: {
      ...occupant,
      placementPoint: { role: "body" },
    },
    [MapEntityTypeId.DREAM_MACHINE]: {
      ...occupant,
      placementPoint: { role: "body" },
    },
    [MapEntityTypeId.BEAVER]: {
      ...occupant,
      placementPoint: { role: "body" },
    },
    [MapEntityTypeId.SPEED]: {
      ...floorFeature,
      defaultFields: { direction: "right" },
      variants: directions,
    },
    [MapEntityTypeId.TIDE]: {
      ...floorFeature,
      defaultFields: { direction: "right" },
      variants: directions,
    },
    [MapEntityTypeId.WINDMILL]: {
      ...occupant,
      defaultFields: { direction: "right" },
      variants: directions,
    },
    [MapEntityTypeId.TIDE_SWITCH]: {
      ...floorFeature,
      variants: catalogVariants(MapEntityTypeId.TIDE_SWITCH),
    },
    [MapEntityTypeId.SPEED_SWITCH]: {
      ...floorFeature,
      variants: catalogVariants(MapEntityTypeId.SPEED_SWITCH),
    },
    [MapEntityTypeId.CAROUSEL_SWITCH]: {
      ...floorFeature,
      variants: catalogVariants(MapEntityTypeId.CAROUSEL_SWITCH),
    },
    [MapEntityTypeId.COLOR_SWITCH]: {
      ...floorFeature,
      defaultFields: { color: "yellow", state: "state-1" },
      variants: catalogVariants(MapEntityTypeId.COLOR_SWITCH),
    },
    [MapEntityTypeId.COLOR_BLOCK]: {
      ...floorFeature,
      defaultFields: { color: "yellow", raised: true },
      variants: catalogVariants(MapEntityTypeId.COLOR_BLOCK),
    },
    [MapEntityTypeId.WIND_SWITCH]: {
      ...floorFeature,
      defaultFields: { direction: "up", active: false },
      variants: windSwitchVariants,
    },
    [MapEntityTypeId.CLOUD]: {
      ...support,
      defaultFields: { color: "red" },
      variants: catalogVariants(MapEntityTypeId.CLOUD),
    },
    [MapEntityTypeId.CLOUD_PARKING]: {
      ...floorFeature,
      defaultFields: { color: "red" },
      variants: catalogVariants(MapEntityTypeId.CLOUD_PARKING),
    },
    [MapEntityTypeId.TRAP]: {
      ...floorFeature,
      variants: catalogVariants(MapEntityTypeId.TRAP),
    },
    [MapEntityTypeId.MIRROR]: {
      ...floorFeature,
      defaultFields: { variant: "right-top" },
      variants: cornerVariants,
    },
    [MapEntityTypeId.CAROUSEL]: {
      ...floorFeature,
      defaultFields: { variant: "right-top" },
      variants: carouselVariants,
    },
    [MapEntityTypeId.PORTAL]: {
      ...floorFeature,
      defaultFields: { channel: "blue", color: "#54e8ff" },
      variants: [
        { label: "blue", fields: { channel: "blue", color: "#54e8ff" } },
        { label: "red", fields: { channel: "red", color: "#ff466e" } },
        { label: "green", fields: { channel: "green", color: "#31d87b" } },
      ],
    },
  },
  stacking: { compatibleSlots },
  palette: BUILTIN_PALETTE_DEFINITION,
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
  ...editorDirections,
];

export function applyEditorVariant(
  entity: Readonly<LevelEntity>,
  variant: EditorEntityVariant,
): LevelEntity {
  return {
    ...entity,
    ...(variant.fields ?? {}),
  };
}

function withPolicy(
  types: readonly EntityType[],
  policy: EditorEntityDefinition,
): Partial<Record<EntityType, EditorEntityDefinition>> {
  return Object.fromEntries(types.map((type) => [type, policy]));
}

function catalogVariants(type: EntityType): readonly EditorEntityVariant[] {
  const variants: EditorEntityVariant[] = [];
  const seen = new Set<string>();
  for (const visual of originalTileVisualGroup(type).visuals) {
    if (visual.role || visual.phase) continue;
    const fields = visual.fields;
    const key = JSON.stringify(fields);
    if (seen.has(key)) continue;
    seen.add(key);
    if (Object.keys(fields).length === 0) continue;
    variants.push({
      label: Object.values(visual.fields).map(String).join(" / "),
      fields,
    });
  }
  return variants;
}
