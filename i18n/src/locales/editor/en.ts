import type { EditorTranslationKey } from "./zh-CN.js";
const catalog = {
  "editor.select": "Select",
  "editor.brush": "Brush",
  "editor.fill": "Fill",
  "editor.erase": "Erase",
  "editor.share": "Share",
  "editor.shareTitle": "Map data exchange and sharing",
  "editor.palette": "Palette",
  "editor.surface": "Surface",
  "editor.inspector": "Inspector",
  "editor.level": "Level",
  "editor.play": "Play Test",
  "editor.stopPlay": "Stop Play Test",
  "editor.restartPlay": "Restart Play Test",
  "editor.undoPlay": "Undo Play Test",
  "editor.redoPlay": "Redo Play Test",
  "editor.issueCount": "{count} issues",
  "editor.copySuffix": "Copy",
} satisfies Record<EditorTranslationKey, string>;
export default catalog;