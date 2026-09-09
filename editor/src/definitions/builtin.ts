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

const surface: EditorEntityDefinition = { replaceGroup: "surface" };
const cover: EditorEntityDefinition = { replaceGroup: "cover" };
const item: EditorEntityDefinition = { replaceGroup: "item" };
const directSurfaceTypes: readonly EntityType[] = [
  ...SURFACE_ENTITY_DEFINITIONS.map((definition) => definition.type),
];
export const builtinEditorDefinition: EditorDefinition = {
  entities: {
    ...withPolicy(directSurfaceTypes, surface),
    ...withPolicy(
      [
        MapEntityTypeId.SNOW,
        MapEntityTypeId.HIGH_GRASS,
        MapEntityTypeId.ICE_BLOCK,
      ],
      cover,
    ),
    ...withPolicy(
      [
        MapEntityTypeId.CARROT,
        MapEntityTypeId.EGG,
      ],
      item,
    ),
    [MapEntityTypeId.BOBBY]: {
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
      placementPoint: { role: "body" },
      defaultFields: { direction: "left" },
      variants: horizontalDirections,
    },
    [MapEntityTypeId.SANDMAN]: {
      placementPoint: { role: "body" },
    },
    [MapEntityTypeId.DREAM_MACHINE]: {
      placementPoint: { role: "body" },
    },
    [MapEntityTypeId.BEAVER]: {
      placementPoint: { role: "body" },
    },
    [MapEntityTypeId.SPEED]: {
      defaultFields: { direction: "right" },
      variants: directions,
    },
    [MapEntityTypeId.TIDE]: {
      defaultFields: { direction: "right" },
      variants: directions,
    },
    [MapEntityTypeId.WINDMILL]: {
      defaultFields: { direction: "right" },
      variants: directions,
    },
    [MapEntityTypeId.TIDE_SWITCH]: {
      variants: catalogVariants(MapEntityTypeId.TIDE_SWITCH),
    },
    [MapEntityTypeId.SPEED_SWITCH]: {
      variants: catalogVariants(MapEntityTypeId.SPEED_SWITCH),
    },
    [MapEntityTypeId.CAROUSEL_SWITCH]: {
      variants: catalogVariants(MapEntityTypeId.CAROUSEL_SWITCH),
    },
    [MapEntityTypeId.COLOR_SWITCH]: {
      defaultFields: { color: "yellow", state: "state-1" },
      variants: catalogVariants(MapEntityTypeId.COLOR_SWITCH),
    },
    [MapEntityTypeId.COLOR_BLOCK]: {
      defaultFields: { color: "yellow", raised: true },
      variants: catalogVariants(MapEntityTypeId.COLOR_BLOCK),
    },
    [MapEntityTypeId.WIND_SWITCH]: {
      defaultFields: { direction: "up", active: false },
      variants: windSwitchVariants,
    },
    [MapEntityTypeId.CLOUD]: {
      defaultFields: { color: "red" },
      variants: catalogVariants(MapEntityTypeId.CLOUD),
    },
    [MapEntityTypeId.CLOUD_PARKING]: {
      defaultFields: { color: "red" },
      variants: catalogVariants(MapEntityTypeId.CLOUD_PARKING),
    },
    [MapEntityTypeId.TRAP]: { variants: catalogVariants(MapEntityTypeId.TRAP) },
    [MapEntityTypeId.MIRROR]: {
      defaultFields: { variant: "right-top" },
      variants: cornerVariants,
    },
    [MapEntityTypeId.CAROUSEL]: {
      defaultFields: { variant: "right-top" },
      variants: carouselVariants,
    },
    [MapEntityTypeId.PORTAL]: {
      defaultFields: { channel: "blue", color: "#54e8ff" },
      variants: [
        { label: "blue", fields: { channel: "blue", color: "#54e8ff" } },
        { label: "red", fields: { channel: "red", color: "#ff466e" } },
        { label: "green", fields: { channel: "green", color: "#31d87b" } },
      ],
    },
  },
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
