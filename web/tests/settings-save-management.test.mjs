import assert from "node:assert/strict";
import { test } from "vitest";
import { ADVENTURE_STORAGE_KEY } from "../src/storage/contracts.ts";
import { listSaveManagementTargets } from "../src/pages/settings/saveManagementRecords.ts";

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

test("存档管理只为实际存在的 Adventure 和 Explore records 创建 Tab", () => {
  const storage = memoryStorage({
    "bc5r:setting": "{}",
    "bc5r:explore/zeta": "{}",
    [ADVENTURE_STORAGE_KEY]: "",
    "bc5r:explore/alpha": "{}",
    "bc5r:explore/": "{}",
    unrelated: "{}",
  });

  assert.deepEqual(listSaveManagementTargets(storage), [
    { id: "adventure", kind: "adventure", label: "Adventure" },
    {
      id: "explore:alpha",
      kind: "explore",
      label: "Explore / alpha",
      collection: "alpha",
    },
    {
      id: "explore:zeta",
      kind: "explore",
      label: "Explore / zeta",
      collection: "zeta",
    },
  ]);
});

test("没有游戏存档时不创建存档管理 Tab", () => {
  assert.deepEqual(
    listSaveManagementTargets(memoryStorage({ "bc5r:setting": "{}" })),
    [],
  );
});
