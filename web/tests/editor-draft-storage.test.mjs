import assert from "node:assert/strict";
import { test } from "vitest";
import { EntityTypeId } from "@bobby/model";
import { createBlankLevel } from "../../editor/dist/index.js";
import {
  EDITOR_AUTOSAVE_STORAGE_KEY,
  loadEditorAutosave,
  loadEditorNamedSave,
  storeEditorAutosave,
  storeEditorNamedSave,
} from "../src/storage/editorDraftStorage.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    values,
  };
}

test("editor autosave round-trips the latest canonical map", () => {
  const storage = memoryStorage();
  const level = createBlankLevel(7, 6);
  level.meta.name = "Recovered Map";
  level.entities.push({ type: EntityTypeId.CARROT, x: 3, y: 2 });
  storeEditorAutosave(level, storage);

  const restored = loadEditorAutosave(storage);
  assert.equal(restored?.meta.name, "Recovered Map");
  assert.equal(restored?.width, 7);
  assert.equal(
    restored?.entities.some(
      (entity) => entity.type === EntityTypeId.CARROT && entity.x === 3,
    ),
    true,
  );
});

test("named saves are isolated from autosave", () => {
  const storage = memoryStorage();
  const named = createBlankLevel(4, 4);
  named.meta.name = "Named";
  storeEditorNamedSave("slot one", named, storage);

  const autosave = createBlankLevel(8, 8);
  autosave.meta.name = "Working";
  storeEditorAutosave(autosave, storage);

  assert.equal(loadEditorNamedSave("slot one", storage)?.meta.name, "Named");
  assert.equal(loadEditorAutosave(storage)?.meta.name, "Working");
});

test("invalid editor autosave is discarded instead of breaking editor startup", () => {
  const storage = memoryStorage({
    [EDITOR_AUTOSAVE_STORAGE_KEY]: "not-json",
  });
  assert.equal(loadEditorAutosave(storage), null);
  assert.equal(storage.getItem(EDITOR_AUTOSAVE_STORAGE_KEY), null);
});
