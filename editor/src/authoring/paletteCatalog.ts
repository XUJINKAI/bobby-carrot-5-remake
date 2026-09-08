import type { EntityCatalog } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import { isEditorEntityCreatable } from "../definitions/entities.js";
import { editorCatalogEntry } from "../definitions/entities.js";
import type {
  EditorDefinition,
  EditorPaletteEntry,
  EditorPaletteGroup,
  EditorPlacementPreset,
} from "../definitions/types.js";
import { resolveEditorEntityPreviewLayout } from "./entityPreview.js";
import { isSurfaceEntityType } from "./surfaceAuthoring.js";

export interface PaletteItem extends EditorPaletteEntry {
  key: string;
  label: string;
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
  const ungrouped = catalog
    .all()
    .map((definition) => definition.type)
    .filter(
      (type) =>
        isEditorEntityCreatable(editor, type, catalog) &&
        !isSurfaceEntityType(type) &&
        !used.has(type),
    )
    .sort((a, b) => a.localeCompare(b));
  if (ungrouped.length > 0) {
    groups.push({
      id: "ungrouped",
      label: "未分组",
      rows: [
        ungrouped.map((type, index) =>
          resolveEntry(
            { type },
            catalog,
            editor,
            `ungrouped/0/${index}`,
          ),
        ),
      ],
    });
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
      row
        .filter((entry) =>
          !isSurfaceEntityType(entry.type) &&
          isEditorEntityCreatable(editor, entry.type, catalog)
        )
        .map((entry, columnIndex) => {
          used.add(entry.type);
          return resolveEntry(
            entry,
            catalog,
            editor,
            `${group.id}/${rowIndex}/${columnIndex}`,
          );
        }),
    ),
  };
}

function resolveEntry(
  entry: EditorPaletteEntry,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  key: string,
): PaletteItem {
  const previewPreset = previewPresetFor(entry);
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
      editorCatalogEntry(catalog, {
        type: entry.type,
        x: 0,
        y: 0,
        ...(entry.direction ? { direction: entry.direction } : {}),
        ...(entry.fields ?? {}),
      }).presentation.name ??
      entry.type,
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
    ...(preview?.direction ?? entry.direction
      ? { direction: preview?.direction ?? entry.direction }
      : {}),
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}
