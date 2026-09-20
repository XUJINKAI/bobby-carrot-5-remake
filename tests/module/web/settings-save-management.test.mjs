import assert from "node:assert/strict";
import { test } from "vitest";
import { ADVENTURE_STORAGE_KEY } from "../../../web/src/storage/contracts.ts";
import { listSaveManagementTargets } from "../../../web/src/pages/settings/saveManagementRecords.ts";

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
  };
}

test("存档管理使用 Explore discovery 白名单和顺序", () => {
  const storage = memoryStorage({
    "bc5r:setting": "{}",
    "bc5r:explore/alpha": "{}",
    [ADVENTURE_STORAGE_KEY]: "",
    "bc5r:explore/zeta": "{}",
    "bc5r:explore/rogue": "{}",
    unrelated: "{}",
  });
  const collections = [
    { id: "zeta" },
    { id: "missing" },
    { id: "alpha" },
  ];

  assert.deepEqual(listSaveManagementTargets(collections, storage), [
    { id: "adventure", kind: "adventure", label: "Adventure" },
    {
      id: "explore:zeta",
      kind: "explore",
      label: "zeta",
      collection: "zeta",
    },
    {
      id: "explore:alpha",
      kind: "explore",
      label: "alpha",
      collection: "alpha",
    },
  ]);
});

test("没有白名单内游戏存档时不创建存档管理 Tab", () => {
  assert.deepEqual(
    listSaveManagementTargets(
      [{ id: "original" }],
      memoryStorage({
        "bc5r:setting": "{}",
        "bc5r:explore/rogue": "{}",
      }),
    ),
    [],
  );
});
