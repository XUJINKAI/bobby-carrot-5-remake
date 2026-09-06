import {
  parseEditorLevel,
  serializeEditorLevel,
  type EditorMap,
} from "@bobby/editor";
import {
  EDITOR_AUTOSAVE_SLOT,
  EDITOR_AUTOSAVE_STORAGE_KEY,
  EDITOR_STORAGE_PREFIX,
  editorStorageKey,
} from "./contracts.js";

export interface EditorLocalStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EditorNamedSave {
  name: string;
  key: string;
}

/** Automatic working copy. It is deliberately separate from every named save. */
export function loadEditorAutosave(
  storage: EditorLocalStorage = localStorage,
): EditorMap | null {
  return loadAtKey(EDITOR_AUTOSAVE_STORAGE_KEY, storage, true);
}

/** Every EditorDocument change updates only autosave; named saves are never touched here. */
export function storeEditorAutosave(
  level: Readonly<EditorMap>,
  storage: EditorLocalStorage = localStorage,
): void {
  storeAtKey(EDITOR_AUTOSAVE_STORAGE_KEY, level, storage);
}

export function listEditorNamedSaves(
  storage: EditorLocalStorage = localStorage,
): EditorNamedSave[] {
  const saves: EditorNamedSave[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(EDITOR_STORAGE_PREFIX)) continue;
      const encoded = key.slice(EDITOR_STORAGE_PREFIX.length);
      if (!encoded || encoded === EDITOR_AUTOSAVE_SLOT) continue;
      try {
        const name = decodeURIComponent(encoded);
        if (!name.trim()) continue;
        saves.push({ name, key });
      } catch {
        // Ignore malformed keys from unrelated/old data.
      }
    }
  } catch {
    return [];
  }
  return saves.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function loadEditorNamedSave(
  name: string,
  storage: EditorLocalStorage = localStorage,
): EditorMap | null {
  return loadAtKey(editorStorageKey(name), storage, false);
}

/** Explicit Save / Save As only. Editing never calls this function automatically. */
export function storeEditorNamedSave(
  name: string,
  level: Readonly<EditorMap>,
  storage: EditorLocalStorage = localStorage,
): void {
  storeAtKey(editorStorageKey(name), level, storage);
}

export function deleteEditorNamedSave(
  name: string,
  storage: EditorLocalStorage = localStorage,
): void {
  try {
    storage.removeItem(editorStorageKey(name));
  } catch {
    // Storage failures must not break the Editor UI.
  }
}

function loadAtKey(
  key: string,
  storage: EditorLocalStorage,
  removeInvalid: boolean,
): EditorMap | null {
  try {
    const serialized = storage.getItem(key);
    if (!serialized) return null;
    return parseEditorLevel(serialized);
  } catch {
    if (removeInvalid) {
      try {
        storage.removeItem(key);
      } catch {
        // Storage unavailable; keep Editor usable.
      }
    }
    return null;
  }
}

function storeAtKey(
  key: string,
  level: Readonly<EditorMap>,
  storage: EditorLocalStorage,
): void {
  try {
    storage.setItem(key, serializeEditorLevel(level as EditorMap));
  } catch {
    // Quota/privacy mode errors must not interrupt editing.
  }
}
