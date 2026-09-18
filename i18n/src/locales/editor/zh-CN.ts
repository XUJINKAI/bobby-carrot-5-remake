const catalog = {
  "editor.select": "选择",
  "editor.brush": "画笔",
  "editor.fill": "填充",
  "editor.erase": "删除",
  "editor.share": "分享",
  "editor.shareTitle": "地图数据交换与分享",
  "editor.palette": "Palette",
  "editor.surface": "Surface",
  "editor.inspector": "Inspector",
  "editor.level": "Level",
  "editor.play": "Play Test",
  "editor.stopPlay": "Stop Play Test",
  "editor.restartPlay": "Restart Play Test",
  "editor.undoPlay": "Undo Play Test",
  "editor.redoPlay": "Redo Play Test",
  "editor.issueCount": "共 {count} 个问题",
  "editor.copySuffix": "副本",
} as const;
export type EditorTranslationKey = keyof typeof catalog;
export default catalog;