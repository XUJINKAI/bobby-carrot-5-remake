import type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine";
import { entityMapDefinition, type EntityType, type LevelEntity } from "@bobby/model";
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
  stackOrder: number;
  editableScore: number;
}

export interface InspectorEntityGroupModel {
  type: EntityType;
  refs: readonly EntityRef[];
  entities: readonly LevelEntity[];
  definition: EntityCatalogEntry;
  editor?: EditorEntityDefinition;
  count: number;
  editableScore: number;
}

export type InspectorMode = "none" | "cell" | "multi";

export interface InspectorModel {
  mode: InspectorMode;
  selection: EditorSelection | null;
  rect: SelectionRect | null;
  entityCount: number;
  layers: readonly InspectorEntityModel[];
  groups: readonly InspectorEntityGroupModel[];
}

export function buildInspectorModel(
  level: EditorMap,
  catalog: EntityCatalog,
  selection: EditorSelection | null,
  editor: EditorDefinition = builtinEditorDefinition,
): InspectorModel {
  if (!selection) return emptyInspector();
  const rect = selectionRect(selection);
  const preview = new EditorPreview(level, catalog);
  if (rect.width === 1 && rect.height === 1) {
    const layers = cellLayers(
      preview,
      catalog,
      editor,
      rect.left,
      rect.top,
    );
    return {
      mode: "cell",
      selection,
      rect,
      entityCount: layers.length,
      layers,
      groups: [],
    };
  }
  const refs = selectedEntityRefs(level, preview, selection);
  const groups = groupEntities(level, catalog, editor, refs);
  return {
    mode: "multi",
    selection,
    rect,
    entityCount: refs.length,
    layers: [],
    groups,
  };
}

function emptyInspector(): InspectorModel {
  return {
    mode: "none",
    selection: null,
    rect: null,
    entityCount: 0,
    layers: [],
    groups: [],
  };
}

function cellLayers(
  preview: EditorPreview,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  x: number,
  y: number,
): InspectorEntityModel[] {
  return [...preview.inspectCell(x, y).presences]
    .reverse()
    .map((inspection) => {
      const policy = editor.entities?.[inspection.entity.type];
      return {
        ref: inspection.ref,
        entity: inspection.entity,
        definition: catalog.require(inspection.entity.type),
        ...(policy ? { editor: policy } : {}),
        stackOrder: inspection.presence.stackOrder,
        editableScore: entityEditableScore(
          catalog.require(inspection.entity.type),
          policy,
        ),
      };
    });
}

function groupEntities(
  level: EditorMap,
  catalog: EntityCatalog,
  editor: EditorDefinition,
  refs: readonly EntityRef[],
): InspectorEntityGroupModel[] {
  const byType = new Map<EntityType, EntityRef[]>();
  for (const ref of refs) {
    const entity = level.entities[ref.index];
    if (!entity) continue;
    const list = byType.get(entity.type) ?? [];
    list.push(ref);
    byType.set(entity.type, list);
  }
  return [...byType.entries()]
    .map(([type, typeRefs]) => {
      const definition = catalog.require(type);
      const policy = editor.entities?.[type];
      return {
        type,
        refs: typeRefs,
        entities: typeRefs
          .map((ref) => level.entities[ref.index])
          .filter((entity): entity is LevelEntity => Boolean(entity)),
        definition,
        ...(policy ? { editor: policy } : {}),
        count: typeRefs.length,
        editableScore: entityEditableScore(definition, policy),
      };
    })
    .sort(compareGroups);
}

function entityEditableScore(
  definition: EntityCatalogEntry,
  editor: EditorEntityDefinition | undefined,
): number {
  return (
    (editor?.variants?.length ?? 0) * 100 +
    (entityMapDefinition(definition.type)?.fields.length ?? 0) * 10 +
    (editor?.quickActions?.length ?? 0)
  );
}

function compareGroups(
  a: InspectorEntityGroupModel,
  b: InspectorEntityGroupModel,
): number {
  const aEditable = a.editableScore > 0 ? 1 : 0;
  const bEditable = b.editableScore > 0 ? 1 : 0;
  return (
    bEditable - aEditable ||
    b.count - a.count ||
    b.editableScore - a.editableScore ||
    a.definition.presentation.name.localeCompare(b.definition.presentation.name)
  );
}
