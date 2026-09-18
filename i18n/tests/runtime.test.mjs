import assert from "node:assert/strict";
import test from "node:test";
import {
  createTranslator,
  loadTranslationCatalog,
  normalizeLocale,
} from "../dist/index.js";

test("normalizeLocale maps supported language families", () => {
  assert.equal(normalizeLocale("zh"), "zh-CN");
  assert.equal(normalizeLocale("zh-Hans-CN"), "zh-CN");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("ja-JP"), null);
});

test("translator resolves registered catalogs, fallback and interpolation", () => {
  const translator = createTranslator({
    locale: "en",
    fallbackLocale: "zh-CN",
    catalogs: {
      "zh-CN": { fallbackOnly: "后备文案" },
    },
  });
  translator.registerCatalog("en", { greeting: "Hello {name}" });

  assert.equal(translator.t("greeting", { name: "Bobby" }), "Hello Bobby");
  assert.equal(translator.t("fallbackOnly"), "后备文案");
  assert.equal(translator.t("missing.key"), "missing.key");

  translator.setLocale("zh-CN");
  assert.equal(translator.locale, "zh-CN");
});

test("scoped catalogs load independently by locale", async () => {
  const [zh, en] = await Promise.all([
    loadTranslationCatalog("shell", "zh-CN"),
    loadTranslationCatalog("shell", "en"),
  ]);
  assert.equal(zh["shell.settings"], "设置");
  assert.equal(en["shell.settings"], "Settings");
});
