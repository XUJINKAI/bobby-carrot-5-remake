import { EntityTypeId } from "./ids.js";
import type { EntityType, JsonPrimitive } from "./types.js";

/** LevelEntity 顶层公共字段。Entity-specific schema 不得复用这些名字。 */
export const LEVEL_ENTITY_RESERVED_FIELDS = [
  "type",
  "x",
  "y",
  "stackOrder",
] as const;

export type LevelEntityReservedField =
  (typeof LEVEL_ENTITY_RESERVED_FIELDS)[number];

export type EntityMapFieldDefinition =
  | {
      key: string;
      kind: "boolean";
      default?: boolean;
    }
  | {
      key: string;
      kind: "string";
      default?: string;
    }
  | {
      key: string;
      kind: "number";
      default?: number;
      min?: number;
      max?: number;
    }
  | {
      key: string;
      kind: "integer";
      default?: number;
      min?: number;
      max?: number;
    }
  | {
      key: string;
      kind: "enum";
      values: readonly JsonPrimitive[];
      default?: JsonPrimitive;
    };

/**
 * 一种 canonical Entity 在 LevelMap.entities[] 中允许持久化的专属字段。
 * fields 对应 Entity JSON 顶层字段；Engine runtime state、traits、footprint、
 * behaviors、presentation 与 Editor UI metadata 不属于这份合同。
 */
export interface EntityMapDefinition {
  type: EntityType;
  fields: readonly EntityMapFieldDefinition[];
}

/** 连续编号的 source-stable Entity type family。 */
export interface EntityMapIndexedFamilyDefinition {
  prefix: string;
  digits: number;
  min: number;
  max: number;
  fields: readonly EntityMapFieldDefinition[];
}

type BuiltinEntityType = (typeof EntityTypeId)[keyof typeof EntityTypeId];

const DIRECTIONS = ["up", "right", "down", "left"] as const;
const HORIZONTAL_DIRECTIONS = ["left", "right"] as const;

const exactFields: Partial<
  Readonly<Record<BuiltinEntityType, readonly EntityMapFieldDefinition[]>>
> = {
  [EntityTypeId.BOBBY]: [enumField("direction", DIRECTIONS, "down")],
  [EntityTypeId.DRAGON]: [
    enumField("direction", HORIZONTAL_DIRECTIONS, "left"),
  ],
  [EntityTypeId.SPEED]: [enumField("direction", DIRECTIONS, "right")],
  [EntityTypeId.TIDE]: [enumField("direction", DIRECTIONS, "right")],

  [EntityTypeId.TIDE_SWITCH]: [booleanField("pressed", false)],
  [EntityTypeId.SPEED_SWITCH]: [booleanField("pressed", false)],
  [EntityTypeId.CAROUSEL_SWITCH]: [booleanField("pressed", false)],
  [EntityTypeId.COLOR_YELLOW_SWITCH]: [booleanField("pressed", false)],
  [EntityTypeId.COLOR_PINK_SWITCH]: [booleanField("pressed", false)],

  [EntityTypeId.WIND_SWITCH]: [
    enumField("channel", [0, 1, 2, 3], 0),
    booleanField("active", false),
  ],
  [EntityTypeId.TRAP]: [booleanField("active", true)],
  [EntityTypeId.MIRROR]: [enumField("variant", [1, 2, 3, 4], 1)],
  [EntityTypeId.CAROUSEL]: [
    enumField("variant", [1, 2, 3, 4, "vertical", "horizontal"], 1),
  ],
  [EntityTypeId.COLOR_YELLOW_BLOCK]: [booleanField("raised", true)],
  [EntityTypeId.COLOR_PINK_BLOCK]: [booleanField("raised", true)],

  [EntityTypeId.ICE_BLOCK]: [integerField("meltStage", 0, 3, 0)],
  [EntityTypeId.FENCE]: [integerField("variant", 1, 6)],
  [EntityTypeId.LOCK]: [integerField("deathCountdownSeconds", 0, 3600, 0)],
  [EntityTypeId.PORTAL]: [
    enumField("channel", ["blue", "red", "green"], "blue"),
  ],
};

const builtinEntityTypes = Object.values(EntityTypeId) as BuiltinEntityType[];

/** Stable canonical EntityTypeId 对应的持久化 Entity schema。 */
export const ENTITY_MAP_DEFINITIONS = Object.freeze(
  Object.fromEntries(
    builtinEntityTypes.map((type) => [
      type,
      Object.freeze({
        type,
        fields: Object.freeze([...(exactFields[type] ?? [])]),
      }),
    ]),
  ),
) as Readonly<Record<BuiltinEntityType, EntityMapDefinition>>;

/** 当前 source-stable raw Entity families。 */
export const ENTITY_MAP_INDEXED_FAMILIES: readonly EntityMapIndexedFamilyDefinition[] =
  Object.freeze([
    Object.freeze({
      prefix: "background-variant-",
      digits: 3,
      min: 1,
      max: 256,
      fields: Object.freeze([integerField("variant", 1, 256)]),
    }),
    Object.freeze({
      prefix: "walkable-variant-",
      digits: 2,
      min: 1,
      max: 52,
      fields: Object.freeze([integerField("variant", 1, 256)]),
    }),
    Object.freeze({
      prefix: "object-variant-",
      digits: 3,
      min: 1,
      max: 256,
      fields: Object.freeze([]),
    }),
  ]);

export function entityMapDefinition(
  type: EntityType,
): EntityMapDefinition | undefined {
  const exact = (
    ENTITY_MAP_DEFINITIONS as Readonly<Record<string, EntityMapDefinition>>
  )[type];
  if (exact) return exact;

  const family = ENTITY_MAP_INDEXED_FAMILIES.find((candidate) =>
    matchesIndexedFamily(type, candidate),
  );
  return family ? { type, fields: family.fields } : undefined;
}

export function requireEntityMapDefinition(type: EntityType): EntityMapDefinition {
  const definition = entityMapDefinition(type);
  if (!definition) throw new Error(`Unknown map entity type: ${type}`);
  return definition;
}

export function entityMapFields(
  type: EntityType,
): readonly EntityMapFieldDefinition[] {
  return entityMapDefinition(type)?.fields ?? [];
}

export function isLevelEntityReservedField(
  key: string,
): key is LevelEntityReservedField {
  return (LEVEL_ENTITY_RESERVED_FIELDS as readonly string[]).includes(key);
}

function booleanField(
  key: string,
  defaultValue?: boolean,
): EntityMapFieldDefinition {
  return {
    key,
    kind: "boolean",
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
  };
}

function integerField(
  key: string,
  min?: number,
  max?: number,
  defaultValue?: number,
): EntityMapFieldDefinition {
  return {
    key,
    kind: "integer",
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  };
}

function enumField(
  key: string,
  values: readonly JsonPrimitive[],
  defaultValue?: JsonPrimitive,
): EntityMapFieldDefinition {
  return {
    key,
    kind: "enum",
    values,
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
  };
}

function matchesIndexedFamily(
  type: string,
  family: EntityMapIndexedFamilyDefinition,
): boolean {
  if (!type.startsWith(family.prefix)) return false;
  const suffix = type.slice(family.prefix.length);
  if (!new RegExp(`^\\d{${family.digits}}$`).test(suffix)) return false;
  const value = Number(suffix);
  return value >= family.min && value <= family.max;
}
