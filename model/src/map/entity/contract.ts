import type { JsonPrimitive } from "../../shared/json.js";
import type { MapEntityType } from "./ids.js";

export const LEVEL_ENTITY_RESERVED_FIELDS = ["type", "x", "y", "stackOrder"] as const;
export type LevelEntityReservedField = (typeof LEVEL_ENTITY_RESERVED_FIELDS)[number];

interface EntityMapFieldBase {
  key: string;
  /** 供人工审阅的说明；Editor label/help 仍由 Editor 持有。 */
  description?: string;
  /** required 表示 canonical JSON 必须显式写出该字段。 */
  required?: boolean;
}

export type EntityMapFieldDefinition =
  | (EntityMapFieldBase & { kind: "boolean"; default?: boolean })
  | (EntityMapFieldBase & { kind: "string"; default?: string })
  | (EntityMapFieldBase & { kind: "number"; default?: number; min?: number; max?: number })
  | (EntityMapFieldBase & { kind: "integer"; default?: number; min?: number; max?: number })
  | (EntityMapFieldBase & { kind: "enum"; values: readonly JsonPrimitive[]; default?: JsonPrimitive });

export interface EntityMapDefinition {
  type: MapEntityType;
  description?: string;
  fields: readonly EntityMapFieldDefinition[];
}

export function defineEntity(
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

export function booleanField(
  key: string,
  defaultValue?: boolean,
  required = false,
  description?: string,
): EntityMapFieldDefinition {
  return Object.freeze({
    key,
    kind: "boolean",
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...(description ? { description } : {}),
  });
}

export function stringField(
  key: string,
  defaultValue?: string,
  required = false,
  description?: string,
): EntityMapFieldDefinition {
  return Object.freeze({
    key,
    kind: "string",
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...(description ? { description } : {}),
  });
}

export function integerField(
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

export function enumField(
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

export function isLevelEntityReservedField(key: string): key is LevelEntityReservedField {
  return (LEVEL_ENTITY_RESERVED_FIELDS as readonly string[]).includes(key);
}
