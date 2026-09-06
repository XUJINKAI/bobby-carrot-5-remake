import type { EntityType, JsonPrimitive } from "./types.js";

/**
 * Stable entity identities that are allowed to appear in LevelMap.entities[].
 * Engine-only/transient visual identities deliberately do not belong here.
 */
export const MapEntityTypeId = {
  BOBBY: "bobby",

  SNOW: "snow",
  WATER: "water",
  WATER_RIPPLE: "water-ripple",
  START: "start",
  ICE: "ice",
  EXIT: "exit",

  SHOP_DREAM: "shop-dream",
  SHOP_CLOUD9: "shop-cloud9",
  SHOP_SUPER_KEY: "shop-super-key",
  SHOP_STEREO: "shop-stereo",
  SHOP_MUSIC: "shop-music",
  SHOP_SPEED_SHOES: "shop-speed-shoes",
  SHOP_COIN_RADAR: "shop-coin-radar",
  SHOP_UNAVAILABLE: "shop-unavailable",

  SHOVEL_PICKUP: "shovel-pickup",
  MOWER_PARKING: "mower-parking",
  TIDE: "tide",
  TIDE_SWITCH: "tide-switch",
  SPEED_SWITCH: "speed-switch",
  CAROUSEL_SWITCH: "carousel-switch",
  WIND_SWITCH: "wind-switch",
  TRAP: "trap",
  MIRROR: "mirror",
  SPEED: "speed",
  CAROUSEL: "carousel",
  COLOR_SWITCH: "color-switch",
  COLOR_BLOCK: "color-block",
  HIGH_GRASS: "high-grass",

  CARROT: "carrot",
  EGG: "egg",
  EGG_NEST: "egg-nest",
  LOCK: "lock",
  BEANSTALK: "beanstalk",
  BEAN: "bean",
  WINDMILL: "windmill",
  PLANK: "plank",
  DRAGON: "dragon",
  SANDMAN: "sandman",
  DREAM_MACHINE: "dream-machine",
  MOWER: "mower",
  GAS: "gas",
  BEAN_FIELD: "bean-field",
  CLOUD: "cloud",
  ICE_BLOCK: "ice-block",
  BEAVER: "beaver",
  LEAF: "leaf",
  CRUMBLY_ROCK: "crumbly-rock",
  KITE: "kite",
  WHIRLWIND: "whirlwind",
  LANDING: "landing",
  GOLDEN_CARROT: "golden-carrot",
  BONUS_COIN: "bonus-coin",
  FENCE: "fence",
  PORTAL: "portal",
  PUSH_GOAL: "push-goal",
} as const satisfies Record<string, EntityType>;

export type MapEntityType =
  (typeof MapEntityTypeId)[keyof typeof MapEntityTypeId];

/** LevelEntity top-level common fields. Entity-specific schema must not reuse them. */
export const LEVEL_ENTITY_RESERVED_FIELDS = [
  "type",
  "x",
  "y",
  "stackOrder",
] as const;

export type LevelEntityReservedField =
  (typeof LEVEL_ENTITY_RESERVED_FIELDS)[number];

interface EntityMapFieldBase {
  key: string;
  /** Human review note; Editor labels/help remain Editor-owned. */
  description?: string;
  /** Required means the canonical JSON must spell the field out. */
  required?: boolean;
}

export type EntityMapFieldDefinition =
  | (EntityMapFieldBase & {
      kind: "boolean";
      default?: boolean;
    })
  | (EntityMapFieldBase & {
      kind: "string";
      default?: string;
    })
  | (EntityMapFieldBase & {
      kind: "number";
      default?: number;
      min?: number;
      max?: number;
    })
  | (EntityMapFieldBase & {
      kind: "integer";
      default?: number;
      min?: number;
      max?: number;
    })
  | (EntityMapFieldBase & {
      kind: "enum";
      values: readonly JsonPrimitive[];
      default?: JsonPrimitive;
    });

/** One canonical persisted entity contract inside LevelMap.entities[]. */
export interface EntityMapDefinition {
  type: MapEntityType;
  description?: string;
  fields: readonly EntityMapFieldDefinition[];
}

export interface EntityMapMigrationAlias {
  from: string;
  to?: MapEntityType;
  fields?: Readonly<Record<string, JsonPrimitive>>;
  disposition: "rename" | "collapse" | "runtime-only" | "visual-only";
  note: string;
}

/** Raw/source groups that still need semantic naming before Map v1 is frozen. */
export interface UnresolvedEntityMapSource {
  id: string;
  source: string;
  note: string;
}

const DIRECTIONS = ["up", "right", "down", "left"] as const;
const HORIZONTAL_DIRECTIONS = ["left", "right"] as const;
const CORNER_DIRECTIONS = [
  "left-up",
  "right-up",
  "left-down",
  "right-down",
] as const;

const definitions: readonly EntityMapDefinition[] = [
  entity(MapEntityTypeId.BOBBY, [], "Player start anchor. Map JSON does not persist Bobby facing direction."),
  entity(MapEntityTypeId.SNOW),
  entity(MapEntityTypeId.WATER),
  entity(MapEntityTypeId.WATER_RIPPLE, [], "Semantic water ripple entity; animation frames are presentation details."),
  entity(MapEntityTypeId.START),
  entity(MapEntityTypeId.ICE),
  entity(MapEntityTypeId.EXIT),

  entity(MapEntityTypeId.SHOP_DREAM),
  entity(MapEntityTypeId.SHOP_CLOUD9),
  entity(MapEntityTypeId.SHOP_SUPER_KEY),
  entity(MapEntityTypeId.SHOP_STEREO),
  entity(MapEntityTypeId.SHOP_MUSIC),
  entity(MapEntityTypeId.SHOP_SPEED_SHOES),
  entity(MapEntityTypeId.SHOP_COIN_RADAR),
  entity(MapEntityTypeId.SHOP_UNAVAILABLE),

  entity(MapEntityTypeId.SHOVEL_PICKUP),
  entity(MapEntityTypeId.MOWER_PARKING),
  entity(MapEntityTypeId.TIDE, [
    enumField("direction", DIRECTIONS, undefined, true, "Flow direction."),
  ]),
  entity(MapEntityTypeId.TIDE_SWITCH),
  entity(MapEntityTypeId.SPEED_SWITCH),
  entity(MapEntityTypeId.CAROUSEL_SWITCH),
  entity(MapEntityTypeId.WIND_SWITCH, [
    enumField(
      "channel",
      ["yellow", "red", "blue", "purple"],
      undefined,
      true,
      "Wind channel color; raw original numeric channels are adapter details.",
    ),
  ]),
  entity(MapEntityTypeId.TRAP, [], "Initial active/inactive runtime phase is not a map field."),
  entity(MapEntityTypeId.MIRROR, [
    enumField(
      "direction",
      CORNER_DIRECTIONS,
      undefined,
      true,
      "Two-way mirror corner orientation.",
    ),
  ]),
  entity(MapEntityTypeId.SPEED, [
    enumField("direction", DIRECTIONS, undefined, true, "Conveyor/speed direction."),
  ]),
  entity(MapEntityTypeId.CAROUSEL, [
    enumField(
      "direction",
      [...CORNER_DIRECTIONS, "vertical", "horizontal"],
      undefined,
      true,
      "Carousel path orientation; replaces numeric variant 1..4.",
    ),
  ]),
  entity(MapEntityTypeId.COLOR_SWITCH, [
    enumField("color", ["yellow", "pink"], undefined, true),
  ]),
  entity(MapEntityTypeId.COLOR_BLOCK, [
    enumField("color", ["yellow", "pink"], undefined, true),
  ]),
  entity(
    MapEntityTypeId.HIGH_GRASS,
    [],
    "A carrot/egg hidden by grass remains a separate overlapping objective entity; high-grass-objective is not persisted.",
  ),

  entity(MapEntityTypeId.CARROT),
  entity(MapEntityTypeId.EGG),
  entity(MapEntityTypeId.EGG_NEST, [], "Filled/empty presentation is runtime state, not a different map entity type."),
  entity(MapEntityTypeId.LOCK, [
    integerField(
      "deathCountdownSeconds",
      0,
      3600,
      0,
      false,
      "Optional map policy; Adventure may override it when building a session.",
    ),
  ]),
  entity(MapEntityTypeId.BEANSTALK, [], "Canonical beanstalk identity; tip/mid/base/sprout are runtime/presentation phases."),
  entity(MapEntityTypeId.BEAN),
  entity(MapEntityTypeId.WINDMILL, [
    enumField("direction", DIRECTIONS, undefined, true, "Windmill output direction."),
  ]),
  entity(MapEntityTypeId.PLANK, [], "Crumbling/fragments are runtime/presentation phases."),
  entity(MapEntityTypeId.DRAGON, [
    enumField("direction", HORIZONTAL_DIRECTIONS, undefined, true),
  ]),
  entity(MapEntityTypeId.SANDMAN),
  entity(MapEntityTypeId.DREAM_MACHINE),
  entity(MapEntityTypeId.MOWER),
  entity(MapEntityTypeId.GAS),
  entity(MapEntityTypeId.BEAN_FIELD),
  entity(MapEntityTypeId.CLOUD, [
    enumField("color", ["red", "purple", "green"], undefined, true),
  ]),
  entity(MapEntityTypeId.ICE_BLOCK, [], "Melt stage is runtime state and is never persisted in a source map."),
  entity(MapEntityTypeId.BEAVER, [
    enumField(
      "interaction",
      ["dialog", "bonus-key-vendor"],
      "dialog",
      false,
      "Confirmed interaction roles. Fixed dialog IDs still need to be enumerated from Adventure/original data before v1 freeze.",
    ),
    integerField(
      "temporaryKeyPriceBonusCoins",
      0,
      9999,
      3,
      false,
      "Used only by bonus-key-vendor.",
    ),
  ], "Beaver needs a fixed interaction/dialog contract; generic free-form dialog IDs are intentionally not frozen yet."),
  entity(MapEntityTypeId.LEAF),
  entity(MapEntityTypeId.CRUMBLY_ROCK),
  entity(MapEntityTypeId.KITE),
  entity(MapEntityTypeId.WHIRLWIND),
  entity(MapEntityTypeId.LANDING),
  entity(MapEntityTypeId.GOLDEN_CARROT),
  entity(MapEntityTypeId.BONUS_COIN),
  entity(MapEntityTypeId.FENCE, [], "Fence visual topology should be derived from neighboring fence cells rather than persisted as numeric variant."),
  entity(MapEntityTypeId.PORTAL, [
    enumField("channel", ["blue", "red", "green"], undefined, true),
  ]),
  entity(MapEntityTypeId.PUSH_GOAL),
];

export const ENTITY_MAP_DEFINITIONS = Object.freeze(
  Object.fromEntries(definitions.map((definition) => [definition.type, definition])),
) as Readonly<Record<MapEntityType, EntityMapDefinition>>;

/**
 * Reviewable migration from current implementation/raw names into the proposed stable Map ABI.
 * This is migration documentation, not an accepted alias layer in the final parser.
 */
export const ENTITY_MAP_MIGRATION_ALIASES: readonly EntityMapMigrationAlias[] = Object.freeze([
  rename("water-animated", MapEntityTypeId.WATER_RIPPLE, {}, "Animation naming is presentation-oriented; map meaning is ripple."),
  visualOnly("water-variant-1", "One water animation/presentation frame, not a map entity."),
  visualOnly("water-variant-2", "One water animation/presentation frame, not a map entity."),
  visualOnly("water-variant-3", "One water animation/presentation frame, not a map entity."),
  runtimeOnly("shovel-cleared-ground", "Result of shovel interaction."),
  runtimeOnly("high-grass-objective", "Represent as overlapping high-grass + carrot/egg; covered visual is presentation."),
  runtimeOnly("consumed-carrot", "Consumed/transient carrot presentation."),
  rename("egg-nest-empty", MapEntityTypeId.EGG_NEST, {}, "Nest fill state is runtime state."),
  runtimeOnly("egg-nest-filled", "Filled nest is runtime/presentation state."),
  rename("beanstalk-tip", MapEntityTypeId.BEANSTALK, {}, "Canonical beanstalk identity."),
  runtimeOnly("beanstalk-mid", "Growth/presentation phase of beanstalk."),
  runtimeOnly("beanstalk-base", "Growth/presentation phase of beanstalk."),
  runtimeOnly("bean-sprout", "Growth/presentation phase of beanstalk."),
  rename("windmill-up", MapEntityTypeId.WINDMILL, { direction: "up" }, "Direction becomes a field."),
  rename("windmill-right", MapEntityTypeId.WINDMILL, { direction: "right" }, "Direction becomes a field."),
  rename("windmill-down", MapEntityTypeId.WINDMILL, { direction: "down" }, "Direction becomes a field."),
  rename("windmill-left", MapEntityTypeId.WINDMILL, { direction: "left" }, "Direction becomes a field."),
  runtimeOnly("plank-crumbling", "Runtime/presentation phase of plank."),
  runtimeOnly("plank-fragment", "Runtime/presentation fragment spawned from plank."),
  runtimeOnly("fireball", "Spawned by Dragon at runtime."),
  rename("cloud-red", MapEntityTypeId.CLOUD, { color: "red" }, "Color becomes a field."),
  rename("cloud-purple", MapEntityTypeId.CLOUD, { color: "purple" }, "Color becomes a field."),
  rename("cloud-green", MapEntityTypeId.CLOUD, { color: "green" }, "Color becomes a field."),
  rename("color-yellow-switch", MapEntityTypeId.COLOR_SWITCH, { color: "yellow" }, "Color becomes a field."),
  rename("color-pink-switch", MapEntityTypeId.COLOR_SWITCH, { color: "pink" }, "Color becomes a field."),
  rename("color-yellow-block", MapEntityTypeId.COLOR_BLOCK, { color: "yellow" }, "Color becomes a field."),
  rename("color-pink-block", MapEntityTypeId.COLOR_BLOCK, { color: "pink" }, "Color becomes a field."),
]);

export const ENTITY_MAP_UNRESOLVED_SOURCES: readonly UnresolvedEntityMapSource[] = Object.freeze([
  {
    id: "original-background-terrain",
    source: "original terrain 0x01..0x1e / current background-variant-*",
    note: "Must be mapped to semantic stable names such as tree/rock/etc. before v1 freeze; generic variant IDs are not accepted Map ABI.",
  },
  {
    id: "original-walkable-terrain",
    source: "original terrain 0x20..0x53 / current walkable-variant-*",
    note: "Must receive semantic stable names (or a semantic surface contract) before v1 freeze.",
  },
  {
    id: "original-ground-terrain",
    source: "original terrain 0x60..0x63 / current ground-a..ground-d",
    note: "ground-a/b/c/d are provisional implementation names and are intentionally excluded from stable Map ABI.",
  },
  {
    id: "original-object-variants",
    source: "current object-variant-* fallback",
    note: "Every remaining raw object needs a semantic canonical identity before v1 freeze.",
  },
  {
    id: "cloud-return-grid",
    source: "current cloud-grid-red/purple/green",
    note: "Semantic gameplay role/name still needs confirmation; color-specific implementation names are not frozen.",
  },
  {
    id: "beaver-dialog-ids",
    source: "Adventure/original Beaver dialog interactions",
    note: "bonus-key-vendor is confirmed, but the fixed normal-dialog ID list has not yet been reconstructed; do not allow arbitrary dialog IDs in the stable schema yet.",
  },
]);

export function entityMapDefinition(type: EntityType): EntityMapDefinition | undefined {
  return (ENTITY_MAP_DEFINITIONS as Readonly<Record<string, EntityMapDefinition>>)[type];
}

export function requireEntityMapDefinition(type: EntityType): EntityMapDefinition {
  const definition = entityMapDefinition(type);
  if (!definition) throw new Error(`Unknown map entity type: ${type}`);
  return definition;
}

export function entityMapFields(type: EntityType): readonly EntityMapFieldDefinition[] {
  return entityMapDefinition(type)?.fields ?? [];
}

export function isLevelEntityReservedField(key: string): key is LevelEntityReservedField {
  return (LEVEL_ENTITY_RESERVED_FIELDS as readonly string[]).includes(key);
}

function entity(
  type: MapEntityType,
  fields: readonly EntityMapFieldDefinition[] = [],
  description?: string,
): EntityMapDefinition {
  return Object.freeze({
    type,
    fields: Object.freeze([...fields]),
    ...(description ? { description } : {}),
  });
}

function enumField(
  key: string,
  values: readonly JsonPrimitive[],
  defaultValue?: JsonPrimitive,
  required = false,
  description?: string,
): EntityMapFieldDefinition {
  return Object.freeze({
    key,
    kind: "enum",
    values: Object.freeze([...values]),
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...(description ? { description } : {}),
  });
}

function integerField(
  key: string,
  min?: number,
  max?: number,
  defaultValue?: number,
  required = false,
  description?: string,
): EntityMapFieldDefinition {
  return Object.freeze({
    key,
    kind: "integer",
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(required ? { required: true } : {}),
    ...(description ? { description } : {}),
  });
}

function rename(
  from: string,
  to: MapEntityType,
  fields: Readonly<Record<string, JsonPrimitive>>,
  note: string,
): EntityMapMigrationAlias {
  return { from, to, fields, disposition: "rename", note };
}

function runtimeOnly(from: string, note: string): EntityMapMigrationAlias {
  return { from, disposition: "runtime-only", note };
}

function visualOnly(from: string, note: string): EntityMapMigrationAlias {
  return { from, disposition: "visual-only", note };
}
