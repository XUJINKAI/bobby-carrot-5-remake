import assert from "node:assert/strict";
import { test } from "vitest";
import { BC5R_GAME_ID } from "@bobby/model";
import { WEB_ERROR_CODES, WebError } from "../src/errors/errorCodes.ts";
import {
  exploreSaveCollection,
  parseExploreCollectionExchange,
  saveExploreCollectionSave,
  serializeExploreCollectionSave,
} from "../src/storage/exploreProgressStorage.ts";

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

test("Explore save 通过 scope 标识 collection 并规范化进度", () => {
  const save = parseExploreCollectionExchange({
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: "explore/original",
    completedMaps: ["1-2", "1-1", "1-1"],
    lastMap: "1-2",
  });

  assert.equal(exploreSaveCollection(save), "original");
  assert.deepEqual(save.completedMaps, ["1-1", "1-2"]);
  assert.equal(save.lastMap, "1-2");
  assert.deepEqual(JSON.parse(serializeExploreCollectionSave(save)), save);
});

test("Settings 导入要求 scope 与当前 collection 一致", () => {
  const value = {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: "explore/engine-lab",
    completedMaps: ["00-intro"],
  };

  assert.deepEqual(
    parseExploreCollectionExchange(value, "engine-lab"),
    value,
  );
  assert.throws(
    () => parseExploreCollectionExchange(value, "original"),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.saveExchange.invalidExploreSave,
  );
});

test("Explore save 拒绝旧聚合格式与非法 scope", () => {
  for (const value of [
    {
      game: BC5R_GAME_ID,
      schemaVersion: 1,
      mode: "explore",
      collections: {},
    },
    {
      game: BC5R_GAME_ID,
      schemaVersion: 1,
      scope: "explore/",
      completedMaps: [],
    },
  ]) {
    assert.throws(
      () => parseExploreCollectionExchange(value),
      (error) =>
        error instanceof WebError &&
        error.code === WEB_ERROR_CODES.saveExchange.invalidExploreSave,
    );
  }
});

test("保存 Explore save 前校验 collection scope", () => {
  const storage = memoryStorage();
  const previousLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  try {
    assert.throws(
      () =>
        saveExploreCollectionSave("original", {
          game: BC5R_GAME_ID,
          schemaVersion: 1,
          scope: "explore/engine-lab",
          completedMaps: [],
        }),
      /有效 Explore Collection Save/,
    );
    assert.equal(storage.values.size, 0);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  }
});
