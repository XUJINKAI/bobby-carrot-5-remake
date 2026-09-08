import assert from "node:assert/strict";
import { test } from "vitest";
import { SETTING_STORAGE_KEY } from "../src/storage/contracts.ts";
import {
  createDefaultWebSettings,
  initializeWebSettings,
  loadWebSettings,
  parseWebSettings,
  updateWebSettings,
} from "../src/storage/settingsStorage.ts";

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

test("设置默认值接收浏览器环境决定的 locale 和屏幕控制能力", () => {
  assert.deepEqual(
    createDefaultWebSettings({ locale: "en", screenControlEnabled: true }),
    {
      schemaVersion: 1,
      locale: "en",
      theme: "bobby",
      audio: {
        musicEnabled: true,
        musicMode: "follow-theme",
        volume: 100,
      },
      controls: { screenControlEnabled: true },
      editor: { paletteSize: 48 },
    },
  );
});

test("bc5r:setting 使用严格的完整 schema v1", () => {
  const setting = createDefaultWebSettings({
    locale: "zh-CN",
    screenControlEnabled: false,
  });
  assert.deepEqual(parseWebSettings(setting), setting);
  assert.throws(
    () => parseWebSettings({ ...setting, extra: true }),
    /设置字段/,
  );
  assert.throws(
    () =>
      parseWebSettings({
        ...setting,
        audio: { ...setting.audio, volume: 201 },
      }),
    /audio\.volume/,
  );
});

test("非法设置 record 会被清理并恢复当前环境默认值", () => {
  const storage = memoryStorage({
    [SETTING_STORAGE_KEY]: JSON.stringify({ schemaVersion: 1 }),
  });
  const setting = loadWebSettings(
    { locale: "en", screenControlEnabled: true },
    storage,
  );
  assert.equal(setting.locale, "en");
  assert.equal(setting.controls.screenControlEnabled, true);
  assert.equal(storage.getItem(SETTING_STORAGE_KEY), null);
});

test("更新一个设置字段会保留同一文档中的其他领域", () => {
  const storage = memoryStorage();
  initializeWebSettings(
    { locale: "zh-CN", screenControlEnabled: false },
    storage,
  );
  const updated = updateWebSettings((setting) => ({
    ...setting,
    audio: { ...setting.audio, volume: 150 },
  }));

  assert.equal(updated.audio.volume, 150);
  assert.equal(updated.locale, "zh-CN");
  assert.equal(updated.editor.paletteSize, 48);
  assert.deepEqual(
    [...storage.values.keys()],
    [SETTING_STORAGE_KEY],
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(SETTING_STORAGE_KEY)),
    updated,
  );
});
