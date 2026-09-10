import {
  booleanField,
  defineEntity,
  enumField,
  integerField,
  stringField,
  type EntityMapDefinition,
  type EntityMapFieldDefinition,
} from "./contract.js";
import {
  MapEntityTypeId,
  type MapEntityType,
} from "./ids.js";
import {
  SURFACE_ENTITY_DEFINITIONS,
} from "./surface.js";
import {
  ORIGINAL_TILE_VISUAL_GROUPS,
  ORIGINAL_TILE_VISUALS,
  originalTileCoordinateLabel,
} from "./original-tile-visual-catalog.js";

const DIRECTIONS = ["up", "right", "down", "left"] as const;
const HORIZONTAL_DIRECTIONS = ["left", "right"] as const;
const CORE_ENTITY_DEFINITIONS: readonly EntityMapDefinition[] = [
  defineEntity(
    MapEntityTypeId.BOBBY,
    [
      enumField(
        "controller",
        [0, 1],
        0,
        false,
        "输入通道；0 是默认通道，1 是第二通道。",
      ),
      booleanField("mirrorX", false, false, "水平镜像输入方向。"),
      booleanField("mirrorY", false, false, "垂直镜像输入方向。"),
    ],
    "Player start anchor. Facing direction is runtime state.",
  ),
  defineEntity(
    MapEntityTypeId.ORIGINAL_TILE,
    [
      enumField(
        "variant",
        ORIGINAL_TILE_VISUALS.map(originalTileCoordinateLabel),
        undefined,
        true,
      ),
    ],
    "原版记录把 Palette 图块写入 terrain 时使用的单格视觉实体。",
  ),
  defineEntity(MapEntityTypeId.START),
  defineEntity(MapEntityTypeId.EXIT),

  defineEntity(MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET),
  defineEntity(MapEntityTypeId.SHOP_CLOUD9_TICKET),
  defineEntity(MapEntityTypeId.SHOP_SUPER_KEY),
  defineEntity(MapEntityTypeId.SHOP_STEREO_SYSTEM),
  defineEntity(MapEntityTypeId.SHOP_EXTRA_MUSIC),
  defineEntity(MapEntityTypeId.SHOP_SPEED_SHOES),
  defineEntity(MapEntityTypeId.SHOP_COIN_RADAR),
  defineEntity(MapEntityTypeId.SHOP_EMPTY),

  defineEntity(MapEntityTypeId.SHOVEL_PICKUP),
  defineEntity(MapEntityTypeId.MOWER_PARKING),
  defineEntity(MapEntityTypeId.TIDE, [
    enumField("direction", DIRECTIONS, undefined, true, "Flow direction."),
  ]),
  defineEntity(MapEntityTypeId.TIDE_SWITCH, [
    booleanField("pressed", false, false, "Initial switch state."),
  ]),
  defineEntity(MapEntityTypeId.SPEED_SWITCH, [
    booleanField("pressed", false, false, "Initial switch state."),
  ]),
  defineEntity(MapEntityTypeId.CAROUSEL_SWITCH, [
    booleanField("pressed", false, false, "Initial switch state."),
  ]),
  defineEntity(MapEntityTypeId.WIND_SWITCH, [
    enumField(
      "direction",
      DIRECTIONS,
      undefined,
      true,
      "Wind direction controlled by this switch. Color is presentation-only.",
    ),
    booleanField("active", false, false, "Initial wind-switch state."),
  ]),
  defineEntity(MapEntityTypeId.TRAP, [
    booleanField("active", true, false, "Initial trap state."),
  ]),
  defineEntity(MapEntityTypeId.MIRROR, [
    enumField(
      "variant",
      ["right-bottom", "left-bottom", "right-top", "left-top"],
      "right-bottom",
      true,
      "Two-way mirror corner orientation.",
    ),
  ]),
  defineEntity(MapEntityTypeId.SPEED, [
    enumField("direction", DIRECTIONS, undefined, true),
  ]),
  defineEntity(MapEntityTypeId.CAROUSEL, [
    enumField(
      "variant",
      [
        "right-top",
        "left-top",
        "left-bottom",
        "right-bottom",
        "vertical",
        "horizontal",
      ],
      "right-top",
      true,
    ),
  ]),
  defineEntity(MapEntityTypeId.COLOR_SWITCH, [
    enumField("color", ["yellow", "pink"], undefined, true),
    enumField("state", ["state-1", "state-2"], "state-1", true),
  ]),
  defineEntity(MapEntityTypeId.COLOR_BLOCK, [
    enumField("color", ["yellow", "pink"], undefined, true),
    booleanField("raised", true, false, "Initial block state."),
  ]),
  defineEntity(
    MapEntityTypeId.HIGH_GRASS,
    [],
    "Covered carrot/egg is overlapping high-grass + objective; covered visual is presentation.",
  ),
  defineEntity(MapEntityTypeId.SNOW),
  defineEntity(MapEntityTypeId.CARROT),
  defineEntity(
    MapEntityTypeId.EGG,
    [],
    "Filled/empty is runtime state, not a different map entity type.",
  ),
  defineEntity(MapEntityTypeId.LOCK, [
    integerField(
      "deathCountdownSeconds",
      0,
      3600,
      0,
      false,
      "Optional map policy; Adventure may override it.",
    ),
  ]),
  defineEntity(
    MapEntityTypeId.BEANSTALK,
    [],
    "Canonical beanstalk identity; tip/mid/base/sprout are runtime/presentation phases.",
  ),
  defineEntity(MapEntityTypeId.BEAN),
  defineEntity(MapEntityTypeId.WINDMILL, [
    enumField("direction", DIRECTIONS, undefined, true),
  ]),
  defineEntity(
    MapEntityTypeId.PLANK,
    [],
    "Crumbling/fragments are runtime/presentation phases.",
  ),
  defineEntity(MapEntityTypeId.DRAGON, [
    enumField("direction", HORIZONTAL_DIRECTIONS, undefined, true),
  ]),
  defineEntity(MapEntityTypeId.SANDMAN, [
    stringField("dialogue", undefined, false, "角色被碰触时显示的地图对白。"),
  ]),
  defineEntity(MapEntityTypeId.DREAM_MACHINE, [
    stringField("dialogue", undefined, false, "角色被碰触时显示的地图对白。"),
  ]),
  defineEntity(MapEntityTypeId.MOWER),
  defineEntity(MapEntityTypeId.GAS),
  defineEntity(MapEntityTypeId.BEAN_FIELD),
  defineEntity(MapEntityTypeId.CLOUD_PARKING, [
    enumField("color", ["red", "purple", "green"], undefined, true),
  ]),
  defineEntity(MapEntityTypeId.CLOUD, [
    enumField("color", ["red", "purple", "green"], undefined, true),
  ]),
  defineEntity(
    MapEntityTypeId.ICE_BLOCK,
    [],
    "Melt stage is runtime state and is never persisted in a source map.",
  ),
  defineEntity(MapEntityTypeId.BEAVER, [
    stringField("dialogue", undefined, false, "角色被碰触时显示的地图对白。"),
  ]),
  defineEntity(MapEntityTypeId.LEAF),
  defineEntity(MapEntityTypeId.CRUMBLY_ROCK),
  defineEntity(
    MapEntityTypeId.PUSHABLE_BOX,
    [],
    "Sokoban box with pushability defined by its type rather than per-map traits.",
  ),
  defineEntity(MapEntityTypeId.KITE),
  defineEntity(MapEntityTypeId.WHIRLWIND),
  defineEntity(MapEntityTypeId.LANDING),
  defineEntity(MapEntityTypeId.GOLDEN_CARROT),
  defineEntity(MapEntityTypeId.BONUS_COIN),
  defineEntity(MapEntityTypeId.PORTAL, [
    stringField(
      "channel",
      undefined,
      true,
      "用于配对 Portal 的任意非空频道名。",
      "non-empty",
    ),
    stringField(
      "color",
      undefined,
      true,
      "Portal 的 #rgb、#rrggbb 或常用颜色别名。",
      "color",
    ),
  ]),
  defineEntity(MapEntityTypeId.PUSH_GOAL),
];

const definitions = [...SURFACE_ENTITY_DEFINITIONS, ...CORE_ENTITY_DEFINITIONS];

export const ENTITY_MAP_DEFINITIONS = Object.freeze(
  Object.fromEntries(
    definitions.map((definition) => [definition.type, definition]),
  ),
) as Readonly<Record<string, EntityMapDefinition>>;

validateEntityMapDefinitions();
validateOriginalTileSelectors();

export function entityMapDefinition(
  type: string,
): EntityMapDefinition | undefined {
  return ENTITY_MAP_DEFINITIONS[type];
}

export function requireEntityMapDefinition(type: string): EntityMapDefinition {
  const definition = entityMapDefinition(type);
  if (!definition) throw new Error(`Unknown map entity type: ${type}`);
  return definition;
}

export function entityMapFields(
  type: MapEntityType | string,
): readonly EntityMapFieldDefinition[] {
  return entityMapDefinition(type)?.fields ?? [];
}

function validateOriginalTileSelectors(): void {
  for (const group of ORIGINAL_TILE_VISUAL_GROUPS) {
    const definition = ENTITY_MAP_DEFINITIONS[group.type];
    if (!definition) {
      throw new Error(`Original Tile Visual type 缺少 LevelEntity 合同：${group.type}`);
    }
    for (const visual of group.visuals) {
      for (const [key, value] of Object.entries(visual.fields)) {
        const field = definition.fields.find((candidate) => candidate.key === key);
        if (!field || !fieldAccepts(field, value)) {
          throw new Error(
            `Original Tile Visual selector 不符合 LevelEntity 合同：${group.type}.${key}=${String(value)}`,
          );
        }
      }
    }
  }
}

function validateEntityMapDefinitions(): void {
  const ids = new Set(Object.values(MapEntityTypeId));
  const definitions = new Set(Object.keys(ENTITY_MAP_DEFINITIONS));
  const missing = [...ids].filter((type) => !definitions.has(type));
  const extra = [...definitions].filter((type) => !ids.has(type as MapEntityType));
  if (missing.length === 0 && extra.length === 0) return;
  throw new Error(
    `Map Entity ID 与 Definition 不一致：missing=${missing.join(",")}; extra=${extra.join(",")}`,
  );
}

function fieldAccepts(
  field: EntityMapFieldDefinition,
  value: unknown,
): boolean {
  if (field.kind === "boolean") return typeof value === "boolean";
  if (field.kind === "string") return typeof value === "string";
  if (field.kind === "number") return typeof value === "number" && Number.isFinite(value);
  if (field.kind === "integer") return typeof value === "number" && Number.isInteger(value);
  return field.values.includes(value as never);
}
