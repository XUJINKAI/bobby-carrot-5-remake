import {
  MapEntityTypeId,
  SURFACE_ENTITY_DEFINITIONS,
  originalTileVisual,
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

const directions: readonly EditorEntityVariant[] = (
  ["up", "right", "down", "left"] as const
).map((direction) => ({ fields: { direction }, label: direction }));

const horizontalDirections: readonly EditorEntityVariant[] = [
  { fields: { direction: "left" }, label: "left" },
  { fields: { direction: "right" }, label: "right" },
];
const speedVariants = catalogVariants(MapEntityTypeId.SPEED);
const tideVariants = catalogVariants(MapEntityTypeId.TIDE);
const windmillVariants = catalogVariants(MapEntityTypeId.WINDMILL);

const surface: EditorEntityDefinition = { replaceGroup: "surface" };
const cover: EditorEntityDefinition = { replaceGroup: "cover" };
const item: EditorEntityDefinition = { replaceGroup: "item" };
const directSurfaceTypes: readonly EntityType[] = [
  ...SURFACE_ENTITY_DEFINITIONS.map((definition) => definition.type),
];
const filledEggVisual = originalTileVisual({
  type: MapEntityTypeId.EGG,
  phase: "filled",
});

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
    [MapEntityTypeId.EGG]: {
      ...item,
      editorVisual: () => ({
        layers: [{
          kind: "atlas",
          column: filledEggVisual.column - 1,
          row: filledEggVisual.row - 1,
        }],
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
      variants: speedVariants,
    },
    [MapEntityTypeId.TIDE]: {
      defaultFields: { direction: "right" },
      variants: tideVariants,
    },
    [MapEntityTypeId.WINDMILL]: {
      defaultFields: { direction: "right" },
      variants: windmillVariants,
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
      variants: catalogVariants(MapEntityTypeId.COLOR_SWITCH),
    },
    [MapEntityTypeId.COLOR_BLOCK]: {
      variants: catalogVariants(MapEntityTypeId.COLOR_BLOCK),
    },
    [MapEntityTypeId.WIND_SWITCH]: {
      defaultFields: { direction: "up" },
      variants: catalogVariants(MapEntityTypeId.WIND_SWITCH),
    },
    [MapEntityTypeId.CLOUD]: {
      variants: catalogVariants(MapEntityTypeId.CLOUD),
    },
    [MapEntityTypeId.CLOUD_PARKING]: {
      variants: catalogVariants(MapEntityTypeId.CLOUD_PARKING),
    },
    [MapEntityTypeId.TRAP]: { variants: catalogVariants(MapEntityTypeId.TRAP) },
    [MapEntityTypeId.MIRROR]: { variants: catalogVariants(MapEntityTypeId.MIRROR) },
    [MapEntityTypeId.CAROUSEL]: {
      variants: catalogVariants(MapEntityTypeId.CAROUSEL),
    },
    [MapEntityTypeId.PORTAL]: {
      variants: ["blue", "red", "green"].map((channel) => ({
        label: channel,
        fields: { channel },
      })),
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
