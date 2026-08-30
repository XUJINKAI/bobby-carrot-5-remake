import {
  parseEditorLevel,
  serializeEditorLevel,
  type EditorLevel,
} from "@bobby/editor";

export const EDITOR_DRAFT_STORAGE_KEY = "bc5r:editor-draft:v1";

export interface EditorDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** 浏览器本地草稿只保存 canonical EditorLevel，不保存 selection / viewport 等 UI 状态。 */
export function loadEditorDraft(
  storage: EditorDraftStorage = localStorage,
): EditorLevel | null {
  try {
    const serialized = storage.getItem(EDITOR_DRAFT_STORAGE_KEY);
    if (!serialized) return null;
    return parseEditorLevel(serialized);
  } catch {
    try {
      storage.removeItem(EDITOR_DRAFT_STORAGE_KEY);
    } catch {
      // Storage 不可用时保持 Editor 可用。
    }
    return null;
  }
}

/** 每次 EditorDocument 变化即覆盖本地草稿；Storage 失败不能打断编辑。 */
export function storeEditorDraft(
  level: Readonly<EditorLevel>,
  storage: EditorDraftStorage = localStorage,
): void {
  try {
    storage.setItem(
      EDITOR_DRAFT_STORAGE_KEY,
      serializeEditorLevel(level as EditorLevel),
    );
  } catch {
    // Quota / 隐私模式等错误不应破坏 Editor。
  }
}
