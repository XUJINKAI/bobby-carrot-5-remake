import type { EntityCatalog, EntityFieldDefinition } from "@bobby/engine";
import type { JsonValue, LevelEntity } from "@bobby/model";
import { applyEditorVariant } from "../definitions/builtin.js";
import type {
  EditorEntityDefinition,
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
    ...(preset.direction ? { direction: preset.direction } : {}),
    ...(preset.properties ? { properties: structuredClone(preset.properties) } : {}),
    ...(preset.state ? { state: structuredClone(preset.state) } : {}),
  };
  const current = editorVariantIndex(source, catalog, definition);
  const base = current >= 0 ? current : 0;
  const index = modulo(base + Math.sign(step || 1), variants.length);
  const next = applyEditorVariant(source, variants[index]!);
  return {
    ...preset,
    ...(next.direction ? { direction: next.direction } : {}),
    ...(next.properties ? { properties: next.properties } : {}),
    ...(next.state ? { state: next.state } : {}),
  };
}

function withDefaults(
  entity: Readonly<LevelEntity>,
  catalog: EntityCatalog,
  editor: EditorEntityDefinition | undefined,
): LevelEntity {
  const definition = catalog.require(entity.type);
  return {
    ...structuredClone(entity),
    ...(entity.direction
      ? { direction: entity.direction }
      : editor?.defaultDirection
        ? { direction: editor.defaultDirection }
        : {}),
    properties: {
      ...fieldDefaults(definition.properties),
      ...(entity.properties ?? {}),
    },
    state: {
      ...fieldDefaults(definition.state),
      ...(entity.state ?? {}),
    },
  };
}

function variantMatches(
  entity: Readonly<LevelEntity>,
  variant: EditorEntityVariant,
): boolean {
  if (variant.direction && entity.direction !== variant.direction) return false;
  for (const [key, value] of Object.entries(variant.properties ?? {}))
    if (!same(entity.properties?.[key], value)) return false;
  for (const [key, value] of Object.entries(variant.state ?? {}))
    if (!same(entity.state?.[key], value)) return false;
  return true;
}

function fieldDefaults(
  fields: readonly EntityFieldDefinition[] | undefined,
): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};
  for (const field of fields ?? [])
    if (field.default !== undefined) result[field.key] = structuredClone(field.default);
  return result;
}

function same(left: JsonValue | undefined, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function modulo(value: number, size: number): number {
  return ((value % size) + size) % size;
}
