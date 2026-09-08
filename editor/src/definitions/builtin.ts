import {
  EntityTypeId,
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
const speedVariants = catalogVariants(EntityTypeId.SPEED);
const tideVariants = catalogVariants(EntityTypeId.TIDE);
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
        MapEntityTypeId.EGG,
      ],
      item,
    ),
    [MapEntityTypeId.EGG]: { ...item, label: "Egg" },
    [MapEntityTypeId.BEANSTALK]: { label: "Beanstalk" },
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
    [EntityTypeId.SPEED]: { defaultDirection: "right", variants: speedVariants },
    [EntityTypeId.TIDE]: { defaultDirection: "right", variants: tideVariants },
    [MapEntityTypeId.WINDMILL]: {
      label: "Windmill",
      defaultDirection: "right",
      variants: windmillVariants,
    },
    [EntityTypeId.TIDE_SWITCH]: {
      variants: catalogVariants(EntityTypeId.TIDE_SWITCH),
    },
    [EntityTypeId.SPEED_SWITCH]: {
      variants: catalogVariants(EntityTypeId.SPEED_SWITCH),
    },
    [EntityTypeId.CAROUSEL_SWITCH]: {
      variants: catalogVariants(EntityTypeId.CAROUSEL_SWITCH),
    },
    [EntityTypeId.COLOR_SWITCH]: {
      variants: catalogVariants(EntityTypeId.COLOR_SWITCH),
    },
    [EntityTypeId.COLOR_BLOCK]: {
      variants: catalogVariants(EntityTypeId.COLOR_BLOCK),
    },
    [EntityTypeId.WIND_SWITCH]: {
      defaultDirection: "up",
      variants: catalogVariants(EntityTypeId.WIND_SWITCH),
    },
    [EntityTypeId.TRAP]: { variants: catalogVariants(EntityTypeId.TRAP) },
    [EntityTypeId.MIRROR]: { variants: catalogVariants(EntityTypeId.MIRROR) },
    [EntityTypeId.CAROUSEL]: {
      variants: catalogVariants(EntityTypeId.CAROUSEL),
    },
    [EntityTypeId.PORTAL]: {
      variants: ["blue", "red", "green"].map((channel) => ({
        label: channel,
        fields: { channel },
      })),
    },
  },
  palette: {
    groups: catalogPaletteGroups([
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
            { type: MapEntityTypeId.EGG },
            { type: EntityTypeId.PUSH_GOAL },
            { type: MapEntityTypeId.PUSHABLE_ROCK },
          ],
          [
            { type: EntityTypeId.GOLDEN_CARROT },
            { type: EntityTypeId.BONUS_COIN },
          ],
          [
            { type: EntityTypeId.SHOP_CLOUD9_TICKET },
            { type: EntityTypeId.SHOP_COIN_RADAR },
            { type: EntityTypeId.SHOP_DREAM_MACHINE_TICKET },
            { type: EntityTypeId.SHOP_EXTRA_MUSIC },
            { type: EntityTypeId.SHOP_SPEED_SHOES },
            { type: EntityTypeId.SHOP_STEREO_SYSTEM },
            { type: EntityTypeId.SHOP_SUPER_KEY },
            { type: EntityTypeId.SHOP_EMPTY },
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
            { type: MapEntityTypeId.BEANSTALK },
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
              fields: { color: "yellow", state: "state-1" },
            },
            {
              type: EntityTypeId.COLOR_SWITCH,
              label: "Pink Switch",
              fields: { color: "pink", state: "state-1" },
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
            { type: EntityTypeId.MIRROR, fields: { variant: "right-bottom" } },
            { type: EntityTypeId.CAROUSEL, fields: { variant: "right-top" } },
            { type: EntityTypeId.CAROUSEL_SWITCH },
          ],
          [
            { type: EntityTypeId.DRAGON },
            { type: EntityTypeId.ICE_BLOCK },
            { type: EntityTypeId.PORTAL, fields: { channel: "blue" } },
          ],
          [
            ...directions.map((variant) => ({
              type: MapEntityTypeId.WINDMILL,
              direction: variant.direction!,
            })),
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
    EntityTypeId.BOBBY,
    EntityTypeId.PUSH_GOAL,
    MapEntityTypeId.PUSHABLE_ROCK,
    EntityTypeId.PORTAL,
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
