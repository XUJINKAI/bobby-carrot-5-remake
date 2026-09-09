import type { EditorPlacementPreset } from "@bobby/editor";
import {
  entityMapDefinition,
  type EntityMapFieldDefinition,
  type JsonPrimitive,
} from "@bobby/model";

export function placementPresetWithField(
  source: EditorPlacementPreset,
  key: string,
  raw: string,
): EditorPlacementPreset | null {
  const field = entityMapDefinition(source.type)?.fields.find(
    (candidate) => candidate.key === key,
  );
  if (!field) return null;
  const fields: Record<string, JsonPrimitive> = { ...(source.fields ?? {}) };
  if (raw === "") delete fields[key];
  else fields[key] = coerceEditorFieldValue(field, raw);
  return {
    type: source.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

export function coerceEditorFieldValue(
  field: EntityMapFieldDefinition,
  raw: string,
): JsonPrimitive {
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
  return raw;
}
