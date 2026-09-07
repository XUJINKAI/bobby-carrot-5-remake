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
  type CoordinateObjectEntityType,
  type MapEntityType,
} from "./ids.js";
import {
  coordinateSurfaceDefinition,
  SURFACE_ENTITY_DEFINITIONS,
} from "./surface.js";

const DIRECTIONS = ["up", "right", "down", "left"] as const;
const HORIZONTAL_DIRECTIONS = ["left", "right"] as const;

const CORE_ENTITY_DEFINITIONS: readonly EntityMapDefinition[] = [
  defineEntity(
    MapEntityTypeId.BOBBY,
    [],
    "Player start anchor. Map JSON does not persist Bobby facing direction.",
  ),
  defineEntity(MapEntityTypeId.START),
  defineEntity(MapEntityTypeId.ICE),
  defineEntity(MapEntityTypeId.EXIT),

  defineEntity(MapEntityTypeId.SHOP_DREAM),
  defineEntity(MapEntityTypeId.SHOP_CLOUD9),
  defineEntity(MapEntityTypeId.SHOP_SUPER_KEY),
  defineEntity(MapEntityTypeId.SHOP_STEREO),
  defineEntity(MapEntityTypeId.SHOP_MUSIC),
  defineEntity(MapEntityTypeId.SHOP_SPEED_SHOES),
  defineEntity(MapEntityTypeId.SHOP_COIN_RADAR),
  defineEntity(MapEntityTypeId.SHOP_UNAVAILABLE),

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
      [1, 2, 3, 4],
      1,
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
    booleanField("pressed", false, false, "Initial switch state."),
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
  defineEntity(MapEntityTypeId.FENCE, [
    enumField(
      "variant",
      [
        "ts-16-10",
        "ts-16-11",
        "ts-16-12",
        "ts-16-13",
        "ts-16-14",
        "ts-16-15",
      ],
      undefined,
      true,
    ),
  ]),

  defineEntity(MapEntityTypeId.CARROT),
  defineEntity(MapEntityTypeId.EGG),
  defineEntity(
    MapEntityTypeId.EGG_NEST,
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
    stringField("dialogue", undefined, false, "地图作者设置的对话文本。"),
  ]),
  defineEntity(MapEntityTypeId.DREAM_MACHINE),
  defineEntity(MapEntityTypeId.MOWER),
  defineEntity(MapEntityTypeId.GAS),
  defineEntity(MapEntityTypeId.BEAN_FIELD),
  defineEntity(MapEntityTypeId.CLOUD, [
    enumField("color", ["red", "purple", "green"], undefined, true),
  ]),
  defineEntity(
    MapEntityTypeId.ICE_BLOCK,
    [],
    "Melt stage is runtime state and is never persisted in a source map.",
  ),
  defineEntity(
    MapEntityTypeId.BEAVER,
    [
      enumField(
        "interaction",
        ["dialog", "bonus-key-vendor"],
        "dialog",
        false,
        "Fixed normal dialog IDs still need reconstruction before v1 freeze.",
      ),
      integerField(
        "temporaryKeyPriceBonusCoins",
        0,
        9999,
        3,
        false,
        "Used only by bonus-key-vendor.",
      ),
    ],
    "Beaver needs a fixed interaction/dialog contract; arbitrary dialog IDs are intentionally not frozen.",
  ),
  defineEntity(MapEntityTypeId.LEAF),
  defineEntity(MapEntityTypeId.CRUMBLY_ROCK),
  defineEntity(
    MapEntityTypeId.PUSHABLE_ROCK,
    [],
    "Sokoban box: visually a rock, with pushability defined by its type rather than per-map traits.",
  ),
  defineEntity(MapEntityTypeId.KITE),
  defineEntity(MapEntityTypeId.WHIRLWIND),
  defineEntity(MapEntityTypeId.LANDING),
  defineEntity(MapEntityTypeId.GOLDEN_CARROT),
  defineEntity(MapEntityTypeId.BONUS_COIN),
  defineEntity(MapEntityTypeId.PORTAL, [
    enumField("channel", ["blue", "red", "green"], undefined, true),
  ]),
  defineEntity(MapEntityTypeId.PUSH_GOAL),
];

const definitions = [...SURFACE_ENTITY_DEFINITIONS, ...CORE_ENTITY_DEFINITIONS];

export const ENTITY_MAP_DEFINITIONS = Object.freeze(
  Object.fromEntries(
    definitions.map((definition) => [definition.type, definition]),
  ),
) as Readonly<Record<string, EntityMapDefinition>>;

export function entityMapDefinition(
  type: string,
): EntityMapDefinition | undefined {
  return (
    ENTITY_MAP_DEFINITIONS[type] ??
    coordinateSurfaceDefinition(type) ??
    coordinateObjectDefinition(type)
  );
}

function coordinateObjectDefinition(
  type: string,
): EntityMapDefinition | undefined {
  const match = /^object-(\d+)-(\d+)$/.exec(type);
  if (!match) return undefined;
  const row = Number(match[1]);
  const column = Number(match[2]);
  if (row < 1 || row > 16 || column < 1 || column > 16) return undefined;
  return defineEntity(
    type as CoordinateObjectEntityType,
    [],
    `Unresolved original object at object.png(${row},${column}).`,
  );
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
