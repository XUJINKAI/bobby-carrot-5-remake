import type { JsonPrimitive } from "../shared/json.js";
import type { LevelEntity, LevelMap, MapDocument, MapMeta } from "./document.js";
import { entityMapDefinition } from "./entity/catalog.js";
import type { EntityMapFieldDefinition } from "./entity/contract.js";
import { normalizeColorHex } from "../shared/color.js";
import type { LevelLimit, LevelRules, WinCondition } from "./rules.js";

const MAP_FIELDS = new Set([
  "schemaVersion",
  "meta",
  "width",
  "height",
  "music",
  "note",
  "entities",
  "rules",
]);
const META_FIELDS = new Set(["name", "author"]);
const ENTITY_BASE_FIELDS = new Set(["type", "x", "y", "stackOrder"]);
const INVALID_JSON_FIELDS_KEY = "__invalidJsonFields";

/** 校验 MapDocument 的持久化合同，并返回与输入隔离的副本。 */
export function parseMapDocument(value: unknown): MapDocument {
  const source = parseMapObject(value, true);
  return {
    schemaVersion: 1,
    meta: parseMapMeta(source.meta),
    ...copyOptionalMapFields(source),
    width: source.width as number,
    height: source.height as number,
    entities: structuredClone(source.entities as LevelEntity[]),
  };
}

/** 校验可游玩的地图合同；输入可以是 MapDocument，返回值只保留 LevelMap 字段。 */
export function parseLevelMap(value: unknown): LevelMap {
  return copyLevelMap(parseMapObject(value, false));
}

function parseMapObject(
  value: unknown,
  requireMeta: boolean,
): Record<string, unknown> {
  const source = structuredClone(requireRecord(value, "地图"));
  rejectUnknownFields(source, MAP_FIELDS, "地图");
  if (source.schemaVersion !== 1)
    throw new Error(
      `地图 schemaVersion 必须为 1，实际为 ${String(source.schemaVersion)}`,
    );
  const width = positiveInteger(source.width, "地图 width");
  const height = positiveInteger(source.height, "地图 height");
  if (requireMeta && source.meta === undefined)
    throw new Error("MapDocument 缺少 meta");
  if (source.meta !== undefined) parseMapMeta(source.meta);
  if (
    source.music !== undefined &&
    (typeof source.music !== "string" || source.music.length === 0)
  )
    throw new Error("地图 music 必须为非空字符串");
  if (source.note !== undefined && typeof source.note !== "string")
    throw new Error("地图 note 必须为字符串");
  if (!Array.isArray(source.entities))
    throw new Error("地图 entities 必须为数组");
  source.entities = source.entities.map((entity, index) =>
    parseLevelEntity(entity, index, width, height),
  );
  if (source.rules !== undefined) parseLevelRules(source.rules);
  return source;
}

function copyLevelMap(source: Record<string, unknown>): LevelMap {
  return {
    schemaVersion: 1,
    ...copyOptionalMapFields(source),
    width: source.width as number,
    height: source.height as number,
    entities: structuredClone(source.entities as LevelEntity[]),
  };
}

function copyOptionalMapFields(source: Record<string, unknown>) {
  return {
    ...(source.music !== undefined ? { music: source.music as string } : {}),
    ...(source.note !== undefined ? { note: source.note as string } : {}),
    ...(source.rules !== undefined
      ? { rules: structuredClone(source.rules as LevelRules) }
      : {}),
  };
}

function parseMapMeta(value: unknown): MapMeta {
  const meta = requireRecord(value, "MapDocument meta");
  rejectUnknownFields(meta, META_FIELDS, "MapDocument meta");
  if (typeof meta.name !== "string" || meta.name.length === 0)
    throw new Error("MapDocument meta.name 必须为非空字符串");
  for (const key of ["author"])
    if (meta[key] !== undefined && typeof meta[key] !== "string")
      throw new Error(`MapDocument meta.${key} 必须为字符串`);
  return structuredClone(meta) as unknown as MapMeta;
}

function parseLevelEntity(
  value: unknown,
  index: number,
  width: number,
  height: number,
): LevelEntity {
  const label = `entities[${index}]`;
  const entity = requireRecord(value, label);
  if (typeof entity.type !== "string" || entity.type.length === 0)
    throw new Error(`${label}.type 必须为非空字符串`);
  const x = integer(entity.x, `${label}.x`);
  const y = integer(entity.y, `${label}.y`);
  if (x < 0 || x >= width || y < 0 || y >= height)
    throw new Error(`${label} 坐标 (${x},${y}) 超出 ${width}x${height} 地图`);
  if (entity.stackOrder !== undefined)
    integer(entity.stackOrder, `${label}.stackOrder`);

  const normalized: LevelEntity = {
    type: entity.type,
    x,
    y,
    ...(entity.stackOrder !== undefined
      ? { stackOrder: entity.stackOrder as number }
      : {}),
  };
  const invalidJsonFields: string[] = [];
  for (const [key, fieldValue] of Object.entries(entity)) {
    if (ENTITY_BASE_FIELDS.has(key)) continue;
    if (isJsonPrimitive(fieldValue)) {
      normalized[key] = fieldValue;
      continue;
    }
    normalized[key] = JSON.stringify(fieldValue) ?? String(fieldValue);
    invalidJsonFields.push(key);
  }
  if (invalidJsonFields.length > 0)
    normalized[INVALID_JSON_FIELDS_KEY] = invalidJsonFields.join(", ");
  return normalized;
}

/** 已知 Entity 的实例字段问题由 Engine 降级为占位符，不阻断整张地图。 */
export function levelEntityContractIssues(
  entity: Readonly<LevelEntity>,
  options: { ignoredFields?: readonly string[] } = {},
): string[] {
  const definition = entityMapDefinition(entity.type);
  if (!definition) return [];
  const issues: string[] = [];
  const invalidJsonFields = entity[INVALID_JSON_FIELDS_KEY];
  if (typeof invalidJsonFields === "string" && invalidJsonFields.length > 0)
    issues.push(`字段 ${invalidJsonFields} 原值不是 primitive`);
  const fields = new Map(definition.fields.map((field) => [field.key, field]));
  for (const key of Object.keys(entity)) {
    if (
      ENTITY_BASE_FIELDS.has(key) ||
      key === INVALID_JSON_FIELDS_KEY ||
      fields.has(key) ||
      options.ignoredFields?.includes(key)
    ) continue;
    issues.push(`字段 ${key} 未声明`);
  }
  for (const field of definition.fields) {
    const value = entity[field.key];
    if (field.required && value === undefined) {
      issues.push(`字段 ${field.key} 缺失`);
      continue;
    }
    if (value !== undefined && !fieldAccepts(field, value))
      issues.push(`字段 ${field.key} 不符合 ${field.kind} 合同`);
  }
  return issues;
}

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function fieldAccepts(
  field: EntityMapFieldDefinition,
  value: unknown,
): value is JsonPrimitive {
  if (field.kind === "boolean") return typeof value === "boolean";
  if (field.kind === "string") {
    if (typeof value !== "string") return false;
    if (field.format === "non-empty") return value.trim().length > 0;
    if (field.format === "color") return normalizeColorHex(value) !== null;
    return true;
  }
  if (field.kind === "enum") return field.values.includes(value as JsonPrimitive);
  if (field.kind === "integer" && !Number.isInteger(value)) return false;
  if (field.kind === "number" && !isFiniteNumber(value)) return false;
  if (field.kind === "integer" || field.kind === "number")
    return (
      (field.min === undefined || (value as number) >= field.min) &&
      (field.max === undefined || (value as number) <= field.max)
    );
  return false;
}

function parseLevelRules(value: unknown): LevelRules {
  const rules = requireRecord(value, "地图 rules");
  rejectUnknownFields(rules, new Set(["win", "limits"]), "地图 rules");
  if (rules.win !== undefined) parseWinCondition(rules.win, "地图 rules.win");
  if (rules.limits !== undefined) {
    if (!Array.isArray(rules.limits))
      throw new Error("地图 rules.limits 必须为数组");
    rules.limits.forEach((limit, index) =>
      parseLevelLimit(limit, `地图 rules.limits[${index}]`),
    );
  }
  return structuredClone(rules) as unknown as LevelRules;
}

function parseWinCondition(value: unknown, label: string): WinCondition {
  const condition = requireRecord(value, label);
  if (condition.type === "all" || condition.type === "any") {
    rejectUnknownFields(condition, new Set(["type", "conditions"]), label);
    if (!Array.isArray(condition.conditions) || condition.conditions.length === 0)
      throw new Error(`${label}.conditions 必须为非空数组`);
    condition.conditions.forEach((child, index) =>
      parseWinCondition(child, `${label}.conditions[${index}]`),
    );
    return structuredClone(condition) as unknown as WinCondition;
  }
  if (condition.type === "collect-all") {
    rejectUnknownFields(condition, new Set(["type", "target"]), label);
    selector(condition.target, `${label}.target`);
    return structuredClone(condition) as unknown as WinCondition;
  }
  if (condition.type === "fill-all") {
    rejectUnknownFields(
      condition,
      new Set(["type", "target", "filler"]),
      label,
    );
    selector(condition.target, `${label}.target`);
    selector(condition.filler, `${label}.filler`);
    return structuredClone(condition) as unknown as WinCondition;
  }
  if (condition.type === "reach") {
    rejectUnknownFields(condition, new Set(["type", "target"]), label);
    selector(condition.target, `${label}.target`);
    return structuredClone(condition) as unknown as WinCondition;
  }
  throw new Error(`${label}.type 不是受支持的获胜条件`);
}

function parseLevelLimit(value: unknown, label: string): LevelLimit {
  const limit = requireRecord(value, label);
  if (limit.type === "max-moves") {
    rejectUnknownFields(limit, new Set(["type", "moves"]), label);
    positiveInteger(limit.moves, `${label}.moves`);
    return structuredClone(limit) as unknown as LevelLimit;
  }
  if (limit.type === "max-time-seconds") {
    rejectUnknownFields(limit, new Set(["type", "seconds"]), label);
    positiveInteger(limit.seconds, `${label}.seconds`);
    return structuredClone(limit) as unknown as LevelLimit;
  }
  throw new Error(`${label}.type 不是受支持的限制规则`);
}

function requireRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} 必须为 JSON object`);
  return value as Record<string, unknown>;
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  for (const key of Object.keys(value))
    if (!allowed.has(key)) throw new Error(`${label} 不允许字段 ${key}`);
}

function selector(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`${label} 必须为非空字符串`);
  return value;
}

function integer(value: unknown, label: string): number {
  if (!Number.isInteger(value)) throw new Error(`${label} 必须为整数`);
  return value as number;
}

function positiveInteger(value: unknown, label: string): number {
  const result = integer(value, label);
  if (result <= 0) throw new Error(`${label} 必须大于 0`);
  return result;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
