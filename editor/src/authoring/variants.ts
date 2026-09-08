import type { EntityCatalog } from "@bobby/engine";
import {
  entityMapDefinition,
  isLevelEntityReservedField,
  type JsonPrimitive,
  type LevelEntity,
} from "@bobby/model";
import { applyEditorVariant } from "../definitions/builtin.js";
import { editorEntityDirection } from "../definitions/entities.js";
import type {
  EditorEntityDefinition,
  EditorEntityFields,
  EditorEntityVariant,
  EditorPlacementPreset,
} from "../definitions/types.js";

export function editorVariantIndex(
  entity: Readonly<LevelEntity>,
  catalog: EntityCatalog,
  definition: EditorEntityDefinition | undefined,
): number {
  const variants = definition?.variants ?? [];
  if (variants.length === 0) return -1;
  const effective = withDefaults(entity, catalog, definition);
  return variants.findIndex((variant) => variantMatches(effective, variant));
}

export function cycleEntityVariant(
  entity: Readonly<LevelEntity>,
  catalog: EntityCatalog,
  definition: EditorEntityDefinition | undefined,
  step: number,
): LevelEntity | null {
  const variants = definition?.variants ?? [];
  if (variants.length === 0) return null;
  const current = editorVariantIndex(entity, catalog, definition);
  const base = current >= 0 ? current : 0;
  const index = modulo(base + Math.sign(step || 1), variants.length);
  return applyEditorVariant(entity, variants[index]!);
}

export function cyclePlacementVariant<T extends EditorPlacementPreset>(
  preset: T,
  catalog: EntityCatalog,
  definition: EditorEntityDefinition | undefined,
  step: number,
): T | null {
  const variants = definition?.variants ?? [];
  if (variants.length === 0) return null;
  const source: LevelEntity = {
    type: preset.type,
    x: 0,
    y: 0,
    ...(preset.fields ? structuredClone(preset.fields) : {}),
    ...(preset.direction ? { direction: preset.direction } : {}),
  };
  const current = editorVariantIndex(source, catalog, definition);
  const base = current >= 0 ? current : 0;
  const index = modulo(base + Math.sign(step || 1), variants.length);
  const next = applyEditorVariant(source, variants[index]!);
  const fields = fieldsFromEntity(next);
  const nextDirection = editorEntityDirection(next);
  return {
    ...preset,
    ...(nextDirection ? { direction: nextDirection } : {}),
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

function withDefaults(
  entity: Readonly<LevelEntity>,
  _catalog: EntityCatalog,
  editor: EditorEntityDefinition | undefined,
): LevelEntity {
  const result: LevelEntity = structuredClone(entity) as LevelEntity;
  for (const field of entityMapDefinition(entity.type)?.fields ?? []) {
    if (result[field.key] === undefined && field.default !== undefined)
      result[field.key] = structuredClone(field.default);
  }
  if (!editorEntityDirection(result) && editor?.defaultDirection)
    result["direction"] = editor.defaultDirection;
  return result;
}

function variantMatches(
  entity: Readonly<LevelEntity>,
  variant: EditorEntityVariant,
): boolean {
  if (variant.direction && editorEntityDirection(entity) !== variant.direction) return false;
  for (const [key, value] of Object.entries(variant.fields ?? {}))
    if (!same(entity[key], value)) return false;
  return true;
}

function fieldsFromEntity(entity: Readonly<LevelEntity>): EditorEntityFields {
  const fields: Record<string, JsonPrimitive> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (
      key === "direction" ||
      isLevelEntityReservedField(key) ||
      value === undefined
    )
      continue;
    fields[key] = value;
  }
  return fields;
}

function same(left: JsonPrimitive | undefined, right: JsonPrimitive): boolean {
  return Object.is(left, right);
}

function modulo(value: number, size: number): number {
  return ((value % size) + size) % size;
}
