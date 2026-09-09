import type { EntityCatalog } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import { isEditorEntityCreatable } from "../definitions/entities.js";
import { editorCatalogEntry } from "../definitions/entities.js";
import type {
  EditorDefinition,
  EditorEntityVariant,
  EditorPaletteEntry,
  EditorPaletteGroup,
  EditorPaletteRemainderGroup,
  EditorPlacementPreset,
} from "../definitions/types.js";
import { resolveEditorEntityPreviewLayout } from "./entityPreview.js";
import { isSurfaceEntityType } from "./surfaceAuthoring.js";

export interface PaletteItem extends EditorPaletteEntry {
  key: string;
  label: string;
  traits: readonly string[];
  behaviors: readonly string[];
  previewPreset: EditorPlacementPreset;
  previewWidth: number;
  previewHeight: number;
}

export interface ResolvedPaletteGroup {
  id: string;
  label: string;
  rows: readonly (readonly PaletteItem[])[];
}

export function resolveEditorPalette(
  catalog: EntityCatalog,
  editor: EditorDefinition = builtinEditorDefinition,
): ResolvedPaletteGroup[] {
  const used = new Set<EntityType>();
  const groups = editor.palette.groups
    .map((group) => resolveGroup(group, catalog, editor, used))
    .filter((group) => group.rows.some((row) => row.length > 0));
  for (const remainder of editor.palette.remainders ?? []) {
    const group = resolveRemainderGroup(remainder, catalog, editor, used);
    if (group.rows.some((row) => row.length > 0)) groups.push(group);
  }
  return groups;
}

export function paletteItems(catalog: EntityCatalog): PaletteItem[] {
  return resolveEditorPalette(catalog).flatMap((group) => group.rows.flat());
}

export function paletteGroups(catalog: EntityCatalog): string[] {
  return resolveEditorPalette(catalog).map((group) => group.label);
}

export function paletteGroup(
  catalog: EntityCatalog,
  item: PaletteItem,
): string {
  return (
    resolveEditorPalette(catalog).find((group) =>
      group.rows.some((row) =>
        row.some((candidate) => candidate.key === item.key),
      ),
    )?.label ?? "未分组"
  );
}

export function paletteLabel(
  _catalog: EntityCatalog,
  item: PaletteItem,
): string {
  return item.label;
}

export function resolvePalettePlacement(
  catalog: EntityCatalog,
  editor: EditorDefinition,
  groups: readonly ResolvedPaletteGroup[],
  preset: EditorPlacementPreset,
  fallbackLabel?: string,
): PaletteItem {
  const match = groups
    .flatMap((group) => group.rows.flat())
    .find((item) => samePlacementPreset(item, preset));
  if (match) return match;
  return resolveEntry(
    {
      ...preset,
      ...(fallbackLabel ? { label: fallbackLabel } : {}),
    },
    catalog,
    editor,
    `inspector/${preset.type}/${JSON.stringify(preset.fields ?? {})}`,
  );
}

function resolveGroup(
  group: EditorPaletteGroup,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  used: Set<EntityType>,
): ResolvedPaletteGroup {
  return {
    id: group.id,
    label: group.label,
    rows: group.rows.map((row, rowIndex) =>
      resolveRow(row, group.id, rowIndex, catalog, editor, used),
    ),
  };
}

function resolveRemainderGroup(
  group: EditorPaletteRemainderGroup,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  used: Set<EntityType>,
): ResolvedPaletteGroup {
  const candidates = group.types ?? catalog.all().map((definition) => definition.type);
  const types = [...new Set(candidates)].filter((type) =>
    !used.has(type) && isPaletteEntryAvailable(type, catalog, editor)
  );
  if (group.sort === "type") types.sort((a, b) => a.localeCompare(b));
  const rows = group.rows === "by-type"
    ? types.map((type) => [{ type, ...(group.expand ? { expand: group.expand } : {}) }])
    : [[...types.map((type) => ({
        type,
        ...(group.expand ? { expand: group.expand } : {}),
      }))]];
  return {
    id: group.id,
    label: group.label,
    rows: rows.map((row, rowIndex) =>
      resolveRow(row, group.id, rowIndex, catalog, editor, used)
    ),
  };
}

function resolveRow(
  row: readonly EditorPaletteEntry[],
  groupId: string,
  rowIndex: number,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  used: Set<EntityType>,
): PaletteItem[] {
  return row.flatMap((entry, columnIndex) => {
    if (!isPaletteEntryAvailable(entry.type, catalog, editor)) return [];
    used.add(entry.type);
    return expandEntry(entry, editor).map((resolved, variantIndex) =>
      resolveEntry(
        resolved,
        catalog,
        editor,
        `${groupId}/${rowIndex}/${columnIndex}/${variantIndex}`,
      )
    );
  });
}

function isPaletteEntryAvailable(
  type: EntityType,
  catalog: EntityCatalog,
  editor: EditorDefinition,
): boolean {
  return (
    !isSurfaceEntityType(type) &&
    isEditorEntityCreatable(editor, type, catalog)
  );
}

function expandEntry(
  entry: EditorPaletteEntry,
  editor: EditorDefinition,
): EditorPaletteEntry[] {
  if (entry.expand !== "variants") return [entry];
  const variants = editor.entities?.[entry.type]?.variants ?? [];
  if (variants.length === 0) return [entry];
  return variants.map((variant) => mergeVariant(entry, variant));
}

function mergeVariant(
  entry: EditorPaletteEntry,
  variant: EditorEntityVariant,
): EditorPaletteEntry {
  const fields = {
    ...(entry.fields ?? {}),
    ...(variant.fields ?? {}),
  };
  return {
    type: entry.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
    ...(variant.label !== undefined
      ? { label: variant.label }
      : entry.label !== undefined
        ? { label: entry.label }
        : {}),
    ...(entry.preview ? { preview: entry.preview } : {}),
  };
}

function resolveEntry(
  entry: EditorPaletteEntry,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  key: string,
): PaletteItem {
  const previewPreset = previewPresetFor(entry);
  const definition = editorCatalogEntry(catalog, {
    ...(entry.fields ?? {}),
    type: entry.type,
    x: 0,
    y: 0,
  });
  const layout = resolveEditorEntityPreviewLayout(
    catalog,
    previewPreset,
    editor,
  );
  return {
    ...entry,
    key,
    label:
      entry.label ??
      definition.presentation.name ??
      entry.type,
    traits: definition.traits,
    behaviors: definition.behaviors ?? [],
    previewPreset,
    previewWidth: layout.width,
    previewHeight: layout.height,
  };
}

function previewPresetFor(entry: EditorPaletteEntry): EditorPlacementPreset {
  const preview = entry.preview;
  const fields = {
    ...(entry.fields ?? {}),
    ...(preview?.fields ?? {}),
  };
  return {
    type: entry.type,
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

function samePlacementPreset(
  left: EditorPlacementPreset,
  right: EditorPlacementPreset,
): boolean {
  if (left.type !== right.type) return false;
  const leftFields = left.fields ?? {};
  const rightFields = right.fields ?? {};
  const keys = new Set([
    ...Object.keys(leftFields),
    ...Object.keys(rightFields),
  ]);
  return [...keys].every((key) => Object.is(leftFields[key], rightFields[key]));
}
