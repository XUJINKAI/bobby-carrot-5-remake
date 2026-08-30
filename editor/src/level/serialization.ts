import { normalizeEditorLevel } from "./editorLevel.js";
import type { EditorMap } from "./types.js";

export function serializeEditorLevel(level: EditorMap): string {
  return `${JSON.stringify(normalizeEditorLevel(level), null, 2)}\n`;
}

export function parseEditorLevel(text: string): EditorMap {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (parsed.schemaVersion !== 1)
    throw new Error(
      `不支持的地图 schemaVersion：${String(parsed.schemaVersion)}；当前版本为 1`,
    );
  if (!Array.isArray(parsed.entities))
    throw new Error("JSON 缺少 entities 数组");
  return normalizeEditorLevel(parsed as unknown as EditorMap);
}
