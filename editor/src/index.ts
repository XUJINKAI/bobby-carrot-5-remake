export {
  createBlankLevel,
  fromLevelMap,
  toLevelMap,
  cloneEditorLevel,
  normalizeEditorLevel,
  resizeEditorLevel,
} from "./level/editorLevel.js";
export { serializeEditorLevel, parseEditorLevel } from "./level/serialization.js";
export { validateEditorLevel } from "./level/validation.js";
export type { EditorLevel, EntityRef, InspectedEditorEntity, LevelValidationIssue } from "./level/types.js";
export { EditorDocument } from "./document/EditorDocument.js";
export type { EditorSnapshot, EditorDocumentListener } from "./document/EditorDocument.js";
export {
  addEntity,
  removeEntity,
  moveEntity,
  replaceEntity,
  setEntityDirection,
  updateEntityProperties,
  updateEntityState,
  updateEntityTraits,
  updateMetadata,
  resizeDocument,
  updateMaxMoves,
} from "./document/commands.js";
export type { EditorCommand } from "./document/commands.js";
export { EditorPreview } from "./authoring/EditorPreview.js";
export type { EditorCellInspection, EditorPresenceInspection } from "./authoring/EditorPreview.js";
export { entityCells, placeEntity, resolvePlacement, topEntityRefAt } from "./authoring/entityPlacement.js";
export type { Cell, EntityPlacementPlan, PlacementCell, PlacementOverrides } from "./authoring/entityPlacement.js";
export { paletteItems, paletteGroups, paletteGroup, paletteLabel } from "./authoring/paletteCatalog.js";
export type { PaletteItem } from "./authoring/paletteCatalog.js";
export { buildInspectorModel } from "./authoring/inspectorModel.js";
export type { InspectorModel } from "./authoring/inspectorModel.js";
export { EditorViewport } from "./canvas/EditorViewport.js";
export type { EditorViewportState } from "./canvas/EditorViewport.js";
export { EditorCanvasRenderer, EDITOR_TILE_SIZE } from "./canvas/EditorCanvasRenderer.js";
export type { EditorCanvasRenderState } from "./canvas/EditorCanvasRenderer.js";
export { EditorCanvasInput } from "./canvas/EditorCanvasInput.js";
export type { EditorCanvasInputHandlers } from "./canvas/EditorCanvasInput.js";
export { canvasPointToCell } from "./canvas/coordinates.js";

/** Web editor 的 composition API；Web 不需要越过 @bobby/editor 依赖 Engine authoring。 */
export { createBuiltinEntityCatalog } from "@bobby/engine/authoring";
export type { EntityCatalog, EntityCatalogEntry, EntityFieldDefinition } from "@bobby/engine/authoring";
