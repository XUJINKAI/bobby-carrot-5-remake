import type { EntityCatalog } from "@bobby/engine/authoring";
import type { EntityType } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorPaletteEntry,
  EditorPaletteGroup,
} from "../definitions/types.js";

export interface PaletteItem extends EditorPaletteEntry {
  key: string;
  label: string;
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
  const groups = editor.palette.groups.map((group) => resolveGroup(group, catalog, used));
  const ungrouped = catalog.all()
    .map((definition) => definition.type)
    .filter((type) => editor.entities?.[type]?.creatable !== false && !used.has(type))
    .sort((a, b) => a.localeCompare(b));
  if (ungrouped.length > 0) {
    groups.push({
      id: "ungrouped",
      label: "未分组",
      rows: [ungrouped.map((type, index) => resolveEntry({ type }, catalog, `ungrouped/0/${index}`))],
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

export function paletteGroup(catalog: EntityCatalog, item: PaletteItem): string {
  return resolveEditorPalette(catalog).find((group) =>
    group.rows.some((row) => row.some((candidate) => candidate.key === item.key)),
  )?.label ?? "未分组";
}

export function paletteLabel(_catalog: EntityCatalog, item: PaletteItem): string {
  return item.label;
}

function resolveGroup(
  group: EditorPaletteGroup,
  catalog: EntityCatalog,
  used: Set<EntityType>,
): ResolvedPaletteGroup {
  return {
    id: group.id,
    label: group.label,
    rows: group.rows.map((row, rowIndex) =>
      row.map((entry, columnIndex) => {
        used.add(entry.type);
        return resolveEntry(entry, catalog, `${group.id}/${rowIndex}/${columnIndex}`);
      }),
    ),
  };
}

function resolveEntry(
  entry: EditorPaletteEntry,
  catalog: EntityCatalog,
  key: string,
): PaletteItem {
  return {
    ...entry,
    key,
    label: entry.label ?? catalog.require(entry.type).presentation.name ?? entry.type,
  };
}
