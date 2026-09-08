import type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine";
import {
  entityMapDefinition,
  type Direction,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import type { EditorDefinition, EditorEntityExclusion } from "./types.js";

export function isEditorEntityCreatable(
  editor: EditorDefinition,
  type: EntityType,
  catalog?: EntityCatalog,
): boolean {
  if ((editor.exclude ?? []).some((selector) => matchesExclusion(selector, type)))
    return false;
  if (!entityMapDefinition(type)) return false;
  if (!catalog) return true;
  const definition = catalog.get(type);
  return definition !== undefined && definition.authoring?.palette !== false;
}

/** Editor 与 Engine 共用 canonical Entity Definition。 */
export function editorCatalogEntry(
  catalog: EntityCatalog,
  entity: Readonly<LevelEntity>,
): EntityCatalogEntry {
  return catalog.require(entity.type);
}

/** 读取由具体 EntityMapDefinition 声明并经 parser 校验的方向字段。 */
export function editorEntityDirection(
  entity: Readonly<LevelEntity>,
): Direction | undefined {
  const value = entity["direction"];
  return value === "up" || value === "right" || value === "down" || value === "left"
    ? value
    : undefined;
}

function matchesExclusion(
  selector: EditorEntityExclusion,
  type: EntityType,
): boolean {
  return typeof selector === "string"
    ? selector === type
    : type.startsWith(selector.prefix);
}
