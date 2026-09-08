import assert from "node:assert/strict";
import { test } from "vitest";
import { BC5R_GAME_ID } from "@bobby/model";
import {
  parseExploreProgressExchange,
  saveExploreProgressSave,
  serializeExploreProgressSave,
} from "../src/storage/exploreProgressStorage.ts";

function memoryStorage(initial = {}, failOnKey = null) {
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
      if (key === failOnKey) throw new Error("模拟写入失败");
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    values,
  };
}

test("Explore save exchange normalizes collection-scoped progress data", () => {
  const save = parseExploreProgressExchange({
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    mode: "explore",
    collections: {
      original: {
        game: BC5R_GAME_ID,
        schemaVersion: 1,
        completedMaps: ["1-2", "1-1", "1-1"],
        lastMap: "1-2",
      },
      custom: {
        game: BC5R_GAME_ID,
        schemaVersion: 1,
        completedMaps: ["demo"],
        lastMap: "demo",
      },
    },
  });

  assert.deepEqual(save.collections.original.completedMaps, ["1-1", "1-2"]);
  assert.equal(save.collections.original.lastMap, "1-2");
  assert.deepEqual(JSON.parse(serializeExploreProgressSave(save)), save);
});

test("Explore save exchange rejects unrelated data", () => {
  assert.throws(
    () =>
      parseExploreProgressExchange({
        game: BC5R_GAME_ID,
        schemaVersion: 1,
      }),
    /Explore Save/,
  );
});

test("Explore save 在修改 storage 前拒绝非法 collection ID", () => {
  const storage = memoryStorage({
    "bc5r:explore/original": JSON.stringify({ completedMaps: ["1-1"] }),
  });
  assert.throws(
    () =>
      saveExploreProgressSave({
        game: BC5R_GAME_ID,
        schemaVersion: 1,
        mode: "explore",
        collections: {
          "": {
            game: BC5R_GAME_ID,
            schemaVersion: 1,
            completedMaps: [],
          },
        },
      }, storage),
    /collection ID 无效/,
  );
  assert.equal(storage.values.has("bc5r:explore/original"), true);
});

test("Explore save 写入失败时恢复原有 collection records", () => {
  const originalValue = JSON.stringify({ completedMaps: ["1-1"] });
  const storage = memoryStorage(
    { "bc5r:explore/original": originalValue },
    "bc5r:explore/custom",
  );
  assert.throws(
    () =>
      saveExploreProgressSave({
        game: BC5R_GAME_ID,
        schemaVersion: 1,
        mode: "explore",
        collections: {
          original: {
            game: BC5R_GAME_ID,
            schemaVersion: 1,
            completedMaps: ["1-2"],
          },
          custom: {
            game: BC5R_GAME_ID,
            schemaVersion: 1,
            completedMaps: ["demo"],
          },
        },
      }, storage),
    /模拟写入失败/,
  );
  assert.deepEqual(
    Object.fromEntries(storage.values),
    { "bc5r:explore/original": originalValue },
  );
});
