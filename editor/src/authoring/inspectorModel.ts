import type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorEntityDefinition,
  EditorSelection,
} from "../definitions/types.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";
import {
  selectedEntityRefs,
  selectionRect,
  type SelectionRect,
} from "./selection.js";

export interface InspectorEntityModel {
  ref: EntityRef;
  entity: LevelEntity;
  definition: EntityCatalogEntry;
  editor?: EditorEntityDefinition;
}

export interface InspectorModel {
  selection: EditorSelection | null;
  rect: SelectionRect | null;
  entityCount: number;
  entity: InspectorEntityModel | null;
}

export function buildInspectorModel(
  level: EditorMap,
  catalog: EntityCatalog,
  selection: EditorSelection | null,
  editor: EditorDefinition = builtinEditorDefinition,
): InspectorModel {
  if (!selection)
    return { selection: null, rect: null, entityCount: 0, entity: null };
  const preview = new EditorPreview(level, catalog);
  const refs = selectedEntityRefs(level, preview, selection);
  const ref = refs.length === 1 ? refs[0]! : null;
  const entity = ref ? level.entities[ref.index] : null;
  return {
    selection,
    rect: selectionRect(selection),
    entityCount: refs.length,
    entity: entity
      ? {
          ref: ref!,
          entity,
          definition: catalog.require(entity.type),
          ...(editor.entities?.[entity.type]
            ? { editor: editor.entities[entity.type] }
            : {}),
        }
      : null,
  };
}
