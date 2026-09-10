import type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine";
import {
  entityMapDefinition,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorEntityDefinition,
  EditorPlacementPreset,
  EditorSelection,
} from "../definitions/types.js";
import { editorCatalogEntry } from "../definitions/entities.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { createPlacementPreview } from "./EditorPlacementPreview.js";
import {
  EditorPreview,
  type EditorPresenceInspection,
} from "./EditorPreview.js";
import { isSurfaceEntityType } from "./surfaceAuthoring.js";
import {
  selectedEntityRefs,
  selectionRect,
  type SelectionRect,
} from "./selection.js";
import {
  resolvePlacement,
  type Cell,
  type EntityPlacementStackWarning,
  type PlacementCell,
} from "./entityPlacement.js";

export interface InspectorEntityModel {
  ref: EntityRef;
  entity: LevelEntity;
  definition: EntityCatalogEntry;
  label: string;
  editor?: EditorEntityDefinition;
  role?: string;
  footprint: { width: number; height: number };
  stackOrder: number;
  editableScore: number;
}

export interface InspectorEntityGroupModel {
  type: EntityType;
  refs: readonly EntityRef[];
  entities: readonly LevelEntity[];
  definition: EntityCatalogEntry;
  label: string;
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

export interface PlacementInspectorPreviewModel {
  cell: Cell | null;
  after: InspectorModel;
  placedIndex: number | null;
  replacedCount: number;
  warnings: readonly EntityPlacementStackWarning[];
  valid: boolean;
}

export function buildPlacementInspectorPreview(
  level: EditorMap,
  catalog: EntityCatalog,
  preset: EditorPlacementPreset,
  cell: Cell | null,
  editor: EditorDefinition = builtinEditorDefinition,
): PlacementInspectorPreviewModel {
  if (!cell) {
    const empty = emptyInspector();
    return {
      cell: null,
      after: empty,
      placedIndex: null,
      replacedCount: 0,
      warnings: [],
      valid: false,
    };
  }
  const selection = { anchor: cell, focus: cell };
  const preview = new EditorPreview(level, catalog);
  const current = cellInspectorModel(
    selection,
    cell,
    cellLayers(preview, editor, cell.x, cell.y),
  );
  const plan = resolvePlacement(level, catalog, preset, cell, editor, preview);
  if (!plan.valid) {
    return {
      cell,
      after: current,
      placedIndex: null,
      replacedCount: 0,
      warnings: plan.warnings,
      valid: false,
    };
  }
  const placedIndex = level.entities.length - plan.replace.length;
  const removed = new Set(plan.replace.map((ref) => ref.index));
  const ghostIndex = -1;
  const ghost = createPlacementPreview(preview, plan);
  const afterInspections = [
    ...preview.inspectCell(cell.x, cell.y).presences.filter(
      (inspection) => !removed.has(inspection.ref.index),
    ),
    ...ghost.inspections
      .filter(
        (inspection) =>
          inspection.presence.cell.x === cell.x &&
          inspection.presence.cell.y === cell.y,
      )
      .map((inspection) => ({
        ...inspection,
        ref: { index: ghostIndex },
      })),
  ].sort(compareInspections);
  const afterLayers = inspectionLayers(
    preview,
    editor,
    afterInspections,
    ghostIndex,
    plan.cells,
  ).map((layer) => ({
    ...layer,
    ref: {
      index: layer.ref.index === ghostIndex
        ? placedIndex
        : remapEntityIndex(layer.ref.index, removed),
    },
  }));
  return {
    cell,
    after: cellInspectorModel(selection, cell, afterLayers),
    placedIndex,
    replacedCount: plan.replace.length,
    warnings: plan.warnings,
    valid: true,
  };
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
    const layers = cellLayers(preview, editor, rect.left, rect.top);
    return cellInspectorModel(selection, { x: rect.left, y: rect.top }, layers);
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
  editor: EditorDefinition,
  x: number,
  y: number,
): InspectorEntityModel[] {
  return inspectionLayers(
    preview,
    editor,
    preview.inspectCell(x, y).presences,
  );
}

function inspectionLayers(
  preview: EditorPreview,
  editor: EditorDefinition,
  inspections: readonly EditorPresenceInspection[],
  placedIndex?: number,
  placedCells: readonly PlacementCell[] = [],
): InspectorEntityModel[] {
  return [...inspections]
    .reverse()
    .map((inspection) => {
      const policy = editor.entities?.[inspection.entity.type];
      const footprint = inspection.ref.index === placedIndex
        ? footprintSizeFromCells(placedCells)
        : footprintSize(preview, inspection.ref);
      return {
        ref: inspection.ref,
        entity: inspection.entity,
        definition: inspection.definition,
        label: inspection.definition.presentation.name,
        ...(policy ? { editor: policy } : {}),
        ...(inspection.presence.role
          ? { role: inspection.presence.role }
          : {}),
        footprint,
        stackOrder: inspection.presence.stackOrder,
        editableScore: entityEditableScore(inspection.definition, policy),
      };
    });
}

function cellInspectorModel(
  selection: EditorSelection,
  cell: Cell,
  layers: readonly InspectorEntityModel[],
): InspectorModel {
  return {
    mode: "cell",
    selection,
    rect: {
      left: cell.x,
      top: cell.y,
      right: cell.x,
      bottom: cell.y,
      width: 1,
      height: 1,
    },
    entityCount: layers.length,
    layers,
    groups: [],
  };
}

function compareInspections(
  a: EditorPresenceInspection,
  b: EditorPresenceInspection,
): number {
  return (
    a.presence.stackOrder - b.presence.stackOrder ||
    a.presence.entityId - b.presence.entityId
  );
}

function footprintSize(
  preview: EditorPreview,
  ref: EntityRef,
): { width: number; height: number } {
  const presences = preview.presencesFor(ref);
  if (presences.length === 0) return { width: 1, height: 1 };
  const xs = presences.map(({ presence }) => presence.cell.x);
  const ys = presences.map(({ presence }) => presence.cell.y);
  return {
    width: Math.max(...xs) - Math.min(...xs) + 1,
    height: Math.max(...ys) - Math.min(...ys) + 1,
  };
}

function footprintSizeFromCells(
  cells: readonly PlacementCell[],
): { width: number; height: number } {
  if (cells.length === 0) return { width: 1, height: 1 };
  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  return {
    width: Math.max(...xs) - Math.min(...xs) + 1,
    height: Math.max(...ys) - Math.min(...ys) + 1,
  };
}

function remapEntityIndex(index: number, removed: ReadonlySet<number>): number {
  let offset = 0;
  for (const removedIndex of removed) {
    if (removedIndex < index) offset += 1;
  }
  return index - offset;
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
      const first = level.entities[typeRefs[0]!.index]!;
      const definition = editorCatalogEntry(catalog, first);
      const policy = editor.entities?.[type];
      return {
        type,
        refs: typeRefs,
        entities: typeRefs
          .map((ref) => level.entities[ref.index])
          .filter((entity): entity is LevelEntity => Boolean(entity)),
        definition,
        label: definition.presentation.name,
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
  // Surface 由专用 Surface 面板编辑，不能凭 variant 字段挤到机关分组之前。
  if (isSurfaceEntityType(definition.type)) return 0;
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
  const surfaceOrder =
    Number(isSurfaceEntityType(a.type)) -
    Number(isSurfaceEntityType(b.type));
  if (surfaceOrder !== 0) return surfaceOrder;
  const aEditable = a.editableScore > 0 ? 1 : 0;
  const bEditable = b.editableScore > 0 ? 1 : 0;
  return (
    bEditable - aEditable ||
    b.count - a.count ||
    b.editableScore - a.editableScore ||
    a.label.localeCompare(b.label)
  );
}
