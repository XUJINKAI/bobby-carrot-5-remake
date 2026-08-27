export {
  createBlankLevel,
  fromLevelMap,
  toLevelMap,
  cloneEditorLevel,
  normalizeEditorLevel,
  resizeEditorLevel,
} from "./level/editorLevel.js";
export {
  serializeEditorLevel,
  parseEditorLevel,
} from "./level/serialization.js";
export { validateEditorLevel } from "./level/validation.js";
export type {
  EditorLevel,
  EntityRef,
  InspectedEditorEntity,
  LevelValidationIssue,
} from "./level/types.js";
export { EditorDocument } from "./document/EditorDocument.js";
export type {
  EditorSnapshot,
  EditorDocumentListener,
} from "./document/EditorDocument.js";
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

export { EditorViewport } from "./canvas/EditorViewport.js";
export type { EditorViewportState } from "./canvas/EditorViewport.js";
export {
  EditorCanvasRenderer,
  EDITOR_TILE_SIZE,
} from "./canvas/EditorCanvasRenderer.js";
export type { EditorCanvasRenderState } from "./canvas/EditorCanvasRenderer.js";
export { EditorCanvasInput } from "./canvas/EditorCanvasInput.js";
export type { EditorCanvasInputHandlers } from "./canvas/EditorCanvasInput.js";
export { canvasPointToCell } from "./canvas/coordinates.js";
