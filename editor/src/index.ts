export { createBlankLevel, fromLevelMap, toLevelMap, cloneEditorLevel, normalizeEditorLevel, resizeEditorLevel } from "./level/editorLevel.js";
export { serializeEditorLevel, parseEditorLevel } from "./level/serialization.js";
export { validateEditorLevel } from "./level/validation.js";
export type { EditorMap, EntityRef, InspectedEditorEntity, LevelValidationIssue } from "./level/types.js";
export { builtinEditorDefinition, EDITOR_DIRECTIONS, applyEditorVariant } from "./definitions/builtin.js";
export {
  editorCatalogEntry,
  editorEntityDirection,
  isEditorEntityCreatable,
} from "./definitions/entities.js";
export type { EditorTool, EditorEntityFields, EditorPlacementPreset, EditorSelection, EditorClipboard, EditorPlacementPoint, EditorEntityVariant, EditorQuickAction, EditorEntityDefinition, EditorEntityExclusion, EditorPalettePreview, EditorPaletteExpansion, EditorPaletteEntry, EditorPaletteGroup, EditorPaletteRemainderGroup, EditorPaletteDefinition, EditorDeletionCandidate, EditorDeleteContext, EditorDeletionDefinition, EditorValidationContext, EditorMapValidator, EditorDefinition } from "./definitions/types.js";
export { EditorDocument } from "./document/EditorDocument.js";
export type { EditorSnapshot, EditorDocumentListener } from "./document/EditorDocument.js";
export { addEntity, addEntities, removeEntity, removeEntities, moveEntity, replaceEntity, replaceEntities, reorderEntityStack, setEntityDirection, updateEntityField, updateMetadata, resizeDocument, updateWinCondition, updateMaxMoves, updateMaxTimeSeconds } from "./document/commands.js";
export type { EditorCommand, EditorEntityReplacement } from "./document/commands.js";
export { EditorPreview } from "./authoring/EditorPreview.js";
export type { EditorCellInspection, EditorPresenceInspection } from "./authoring/EditorPreview.js";
export { entityCells, placeEntity, resolvePlacement, topEntityRefAt } from "./authoring/entityPlacement.js";
export type { Cell, EntityPlacementPlan, PlacementCell, PlacementOverrides } from "./authoring/entityPlacement.js";
export { resolveEditorEntityPreviewLayout } from "./authoring/entityPreview.js";
export type { EditorEntityPreviewLayout } from "./authoring/entityPreview.js";
export { resolveEditorPalette, resolvePalettePlacement, paletteItems, paletteGroups, paletteGroup, paletteLabel } from "./authoring/paletteCatalog.js";
export type { PaletteItem, ResolvedPaletteGroup } from "./authoring/paletteCatalog.js";
export { resolveDeletion, resolveDeletionTarget, resolveSelectionDeletionTargets } from "./authoring/deletion.js";
export { selectionRect, selectedEntityRefs } from "./authoring/selection.js";
export type { SelectionRect } from "./authoring/selection.js";
export { copySelection, copyEntitySelection, pasteClipboard } from "./authoring/clipboard.js";
export { previewEditorResize, resizeMapEdges } from "./authoring/resize.js";
export type { EditorResizeEdges, EditorResizeResult } from "./authoring/resize.js";
export { EditorRuleDetector, enableEditorRules, inspectEditorRules, updateEditorRule } from "./authoring/rules.js";
export type { EditorRuleCapability, EditorRuleKind } from "./authoring/rules.js";
export { editorVariantIndex, applyPlacementVariant, cycleEntityVariant, cyclePlacementVariant } from "./authoring/variants.js";
export { buildInspectorModel } from "./authoring/inspectorModel.js";
export type { InspectorModel, InspectorMode, InspectorEntityModel, InspectorEntityGroupModel } from "./authoring/inspectorModel.js";
export { SURFACE_TERRAINS, SURFACE_TERRAIN_GROUPS, SURFACE_THEMES, applySurfaceTheme, defaultSurfaceBrush, detectSurfaceTheme, fillSurface, isSurfaceEntityType, paintSurface, rectangleCells, surfaceTerrain, surfaceTerrainForEntity } from "./authoring/surfaceAuthoring.js";
export { materializeSurfaceVariants, pickSurfaceBrush, replaceSurfaceVisualVariant, surfaceVariantPreset, surfaceVisualVariant } from "./authoring/surfacePersistence.js";
export type { SurfaceBrush, SurfacePattern, SurfaceTerrainDefinition, SurfaceTerrainGroup, SurfaceTerrainId, SurfaceTheme, SurfaceThemeDefinition, SurfaceTool, SurfaceType, SurfaceVariant } from "./authoring/surfaceAuthoring.js";
export { EditorViewport } from "./canvas/EditorViewport.js";
export type { EditorViewportState } from "./canvas/EditorViewport.js";
export { EditorCanvasRenderer, EDITOR_TILE_SIZE } from "./canvas/EditorCanvasRenderer.js";
export type { EditorCanvasRenderState } from "./canvas/EditorCanvasRenderer.js";
export { EditorEntityPreviewRenderer } from "./canvas/EditorEntityPreviewRenderer.js";
export { EditorCanvasInput } from "./canvas/EditorCanvasInput.js";
export type { EditorCanvasInputHandlers, EditorCanvasContextMenuRequest } from "./canvas/EditorCanvasInput.js";
export { canvasPointToCell } from "./canvas/coordinates.js";
export { createBuiltinEntityCatalog } from "@bobby/engine";
export type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine";
