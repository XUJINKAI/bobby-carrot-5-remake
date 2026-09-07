import {
  levelEntityRuntimeType,
  type EntityCatalog,
  type EntityCatalogEntry,
} from "@bobby/engine";
import type { EntityType, LevelEntity } from "@bobby/model";
import type { EditorDefinition, EditorEntityExclusion } from "./types.js";

export function isEditorEntityCreatable(
  editor: EditorDefinition,
  type: EntityType,
  catalog?: EntityCatalog,
): boolean {
  if ((editor.exclude ?? []).some((selector) => matchesExclusion(selector, type)))
    return false;
  if (!catalog) return true;
  const source = { type, x: 0, y: 0 };
  const runtimeType = levelEntityRuntimeType(source);
  if (runtimeType !== type) return true;
  return editorCatalogEntry(catalog, source).authoring?.palette !== false;
}

/** Editor 查询 footprint / Visual 时使用 Runtime Definition，持久化身份仍保留 Map type。 */
export function editorCatalogEntry(
  catalog: EntityCatalog,
  entity: Readonly<LevelEntity>,
): EntityCatalogEntry {
  return catalog.require(levelEntityRuntimeType(entity));
}

function matchesExclusion(
  selector: EditorEntityExclusion,
  type: EntityType,
): boolean {
  return typeof selector === "string"
    ? selector === type
    : type.startsWith(selector.prefix);
}
