import { normalizeEditorLevel } from "./editorLevel.js";
import type { EditorLevel } from "./types.js";

export function serializeEditorLevel(level: EditorLevel): string {
  return `${JSON.stringify(normalizeEditorLevel(level), null, 2)}\n`;
}

export function parseEditorLevel(text: string): EditorLevel {
  const parsed = JSON.parse(text) as Partial<EditorLevel>;
  if (parsed.schemaVersion !== 2)
    throw new Error(
      `不支持的地图 schemaVersion：${String(parsed.schemaVersion)}；当前只接受语义 schema v2`,
    );
  if (!Array.isArray(parsed.terrain))
    throw new Error("JSON 缺少 terrain 二维数组");
  return normalizeEditorLevel(parsed as EditorLevel);
}
