import type { EditorPlacementPreset } from "@bobby/editor";
import {
  entityMapDefinition,
  isLevelEntityReservedField,
  type EntityMapFieldDefinition,
  type LevelEntity,
  type LevelEntityFieldValue,
} from "@bobby/model";

export function placementPresetFromEntity(
  entity: Readonly<LevelEntity>,
): EditorPlacementPreset {
  const fields: Record<string, LevelEntityFieldValue> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (isLevelEntityReservedField(key) || value === undefined) continue;
    fields[key] = value;
  }
  return {
    type: entity.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

export function placementPresetWithField(
  source: EditorPlacementPreset,
  key: string,
  raw: LevelEntityFieldValue,
): EditorPlacementPreset | null {
  const field = entityMapDefinition(source.type)?.fields.find(
    (candidate) => candidate.key === key,
  );
  if (!field) return null;
  const fields: Record<string, LevelEntityFieldValue> = {
    ...(source.fields ?? {}),
  };
  if (raw === "") delete fields[key];
  else fields[key] = coerceEditorFieldValue(field, raw);
  return {
    type: source.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

export function coerceEditorFieldValue(
  field: EntityMapFieldDefinition,
  raw: LevelEntityFieldValue,
): LevelEntityFieldValue {
  if (Array.isArray(raw)) {
    if (field.kind === "string-or-string-list") return [...raw];
    return raw.join("\n");
  }
  if (field.kind === "number" || field.kind === "integer") {
    const value = Number(raw);
    return Number.isFinite(value)
      ? field.kind === "integer"
        ? Math.trunc(value)
        : value
      : raw;
  }
  if (field.kind === "boolean") return raw === "true";
  if (field.kind === "enum") {
    const option = field.values.find((candidate) => String(candidate) === raw);
    if (option !== undefined) return option;
  }
  if (field.kind === "string-or-string-list") {
    return raw;
  }
  return raw;
}
