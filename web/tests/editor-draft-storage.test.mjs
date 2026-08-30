import assert from "node:assert/strict";
import { test } from "vitest";
import { EntityTypeId } from "@bobby/model";
import { createBlankLevel } from "../../editor/dist/index.js";
import {
  EDITOR_DRAFT_STORAGE_KEY,
  loadEditorDraft,
  storeEditorDraft,
} from "../src/storage/editorDraftStorage.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
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

test("editor draft storage round-trips the latest canonical map", () => {
  const storage = memoryStorage();
  const level = createBlankLevel(7, 6);
  level.name = "Recovered Map";
  level.entities.push({ type: EntityTypeId.CARROT, x: 3, y: 2 });
  storeEditorDraft(level, storage);

  const restored = loadEditorDraft(storage);
  assert.equal(restored?.name, "Recovered Map");
  assert.equal(restored?.width, 7);
  assert.equal(
    restored?.entities.some(
      (entity) => entity.type === EntityTypeId.CARROT && entity.x === 3,
    ),
    true,
  );
});

test("invalid editor draft is discarded instead of breaking editor startup", () => {
  const storage = memoryStorage({ [EDITOR_DRAFT_STORAGE_KEY]: "not-json" });
  assert.equal(loadEditorDraft(storage), null);
  assert.equal(storage.getItem(EDITOR_DRAFT_STORAGE_KEY), null);
});
