import {
  MapEntityTypeId,
  SURFACE_ENTITY_DEFINITIONS,
  originalTileVisualGroup,
  originalTileVisualGroups,
  type Direction,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import type {
  EditorDefinition,
  EditorEntityDefinition,
  EditorEntityVariant,
  EditorPaletteEntry,
  EditorPaletteGroup,
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
const speedVariants = catalogVariants(MapEntityTypeId.SPEED);
const tideVariants = catalogVariants(MapEntityTypeId.TIDE);
const windmillVariants = catalogVariants(MapEntityTypeId.WINDMILL);

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
      defaultDirection: "left",
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
    [MapEntityTypeId.SPEED]: { defaultDirection: "right", variants: speedVariants },
    [MapEntityTypeId.TIDE]: { defaultDirection: "right", variants: tideVariants },
    [MapEntityTypeId.WINDMILL]: {
      defaultDirection: "right",
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
      defaultDirection: "up",
      variants: catalogVariants(MapEntityTypeId.WIND_SWITCH),
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
  palette: {
    groups: catalogPaletteGroups([
      {
        id: "objective",
        label: "目标及道具",
        rows: [
          [
            { type: MapEntityTypeId.BOBBY },
            { type: MapEntityTypeId.EXIT },
            { type: MapEntityTypeId.CARROT },
            { type: MapEntityTypeId.EGG },
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
            ...directions.map((variant) => ({
              type: MapEntityTypeId.SPEED,
              direction: variant.direction!,
            })),
            { type: MapEntityTypeId.SPEED_SWITCH },
          ],
          [
            ...directions.map((variant) => ({
              type: MapEntityTypeId.TIDE,
              direction: variant.direction!,
            })),
            { type: MapEntityTypeId.TIDE_SWITCH },
          ],
          [
            {
              type: MapEntityTypeId.COLOR_SWITCH,
              label: "Yellow Switch",
              fields: { color: "yellow", state: "state-1" },
            },
            {
              type: MapEntityTypeId.COLOR_SWITCH,
              label: "Pink Switch",
              fields: { color: "pink", state: "state-1" },
            },
            {
              type: MapEntityTypeId.COLOR_BLOCK,
              label: "Yellow Block",
              fields: { color: "yellow" },
            },
            {
              type: MapEntityTypeId.COLOR_BLOCK,
              label: "Pink Block",
              fields: { color: "pink" },
            },
            { type: MapEntityTypeId.TRAP },
          ],
          [
            { type: MapEntityTypeId.MIRROR, fields: { variant: "right-bottom" } },
            { type: MapEntityTypeId.CAROUSEL, fields: { variant: "right-top" } },
            { type: MapEntityTypeId.CAROUSEL_SWITCH },
          ],
          [
            { type: MapEntityTypeId.DRAGON },
            { type: MapEntityTypeId.ICE_BLOCK },
          ],
          [
            ...directions.map((variant) => ({
              type: MapEntityTypeId.WINDMILL,
              direction: variant.direction!,
            })),
            { type: MapEntityTypeId.WIND_SWITCH, direction: "up" },
            {
              type: MapEntityTypeId.CLOUD,
              label: "Green Cloud",
              fields: { color: "green" },
            },
            {
              type: MapEntityTypeId.CLOUD,
              label: "Purple Cloud",
              fields: { color: "purple" },
            },
            {
              type: MapEntityTypeId.CLOUD,
              label: "Red Cloud",
              fields: { color: "red" },
            },
            {
              type: MapEntityTypeId.CLOUD_PARKING,
              label: "Green Cloud Parking",
              fields: { color: "green" },
            },
            {
              type: MapEntityTypeId.CLOUD_PARKING,
              label: "Purple Cloud Parking",
              fields: { color: "purple" },
            },
            {
              type: MapEntityTypeId.CLOUD_PARKING,
              label: "Red Cloud Parking",
              fields: { color: "red" },
            },
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
    ]),
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

function catalogVariants(type: EntityType): readonly EditorEntityVariant[] {
  const variants: EditorEntityVariant[] = [];
  const seen = new Set<string>();
  for (const visual of originalTileVisualGroup(type).visuals) {
    if (visual.role || visual.phase) continue;
    const { direction, ...fields } = visual.fields;
    const key = JSON.stringify({ direction, fields });
    if (seen.has(key)) continue;
    seen.add(key);
    if (direction === undefined && Object.keys(fields).length === 0) continue;
    variants.push({
      label: Object.values(visual.fields).map(String).join(" / "),
      ...(isDirection(direction) ? { direction } : {}),
      ...(Object.keys(fields).length > 0 ? { fields } : {}),
    });
  }
  return variants;
}

function catalogPaletteGroups(
  layout: readonly EditorPaletteGroup[],
): readonly EditorPaletteGroup[] {
  const tileTypes = new Set(
    originalTileVisualGroups("palette").map((group) => group.type),
  );
  const customTypes = new Set<EntityType>([
    MapEntityTypeId.BOBBY,
    MapEntityTypeId.PUSH_GOAL,
    MapEntityTypeId.PUSHABLE_ROCK,
    MapEntityTypeId.PORTAL,
  ]);
  const placed = new Set<EntityType>();
  const groups = layout.map((group) => ({
    ...group,
    rows: group.rows.map((row) => row.flatMap((entry) => {
      if (customTypes.has(entry.type)) return [entry];
      if (!tileTypes.has(entry.type) || placed.has(entry.type)) return [];
      placed.add(entry.type);
      return catalogPaletteEntries(entry.type);
    })),
  }));
  const missing = [...tileTypes].filter((type) => !placed.has(type));
  if (missing.length > 0) {
    groups.push({
      id: "original-tile-catalog",
      label: "Original Tile",
      rows: missing.map((type) => catalogPaletteEntries(type)),
    });
  }
  return groups;
}

function catalogPaletteEntries(type: EntityType): EditorPaletteEntry[] {
  const variants = catalogVariants(type);
  if (variants.length === 0) return [{ type }];
  return variants.map((variant) => ({
    type,
    ...(variant.label ? { label: variant.label } : {}),
    ...(variant.direction ? { direction: variant.direction } : {}),
    ...(variant.fields ? { fields: variant.fields } : {}),
  }));
}

function isDirection(value: unknown): value is Direction {
  return value === "up" || value === "right" || value === "down" || value === "left";
}
