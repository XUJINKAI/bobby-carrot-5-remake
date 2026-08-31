import assert from "node:assert/strict";
import test from "node:test";
import {
  createTranslator,
  normalizeLocale,
} from "../dist/index.js";

test("normalizeLocale maps supported language families", () => {
  assert.equal(normalizeLocale("zh"), "zh-CN");
  assert.equal(normalizeLocale("zh-Hans-CN"), "zh-CN");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("ja-JP"), null);
});

test("translator resolves current locale, fallback and interpolation", () => {
  const translator = createTranslator({
    locale: "en",
    fallbackLocale: "zh-CN",
    catalogs: {
      en: {
        greeting: "Hello {name}",
      },
      "zh-CN": {
        greeting: "你好 {name}",
        fallbackOnly: "后备文案",
      },
    },
  });

  assert.equal(translator.t("greeting", { name: "Bobby" }), "Hello Bobby");
  assert.equal(translator.t("fallbackOnly"), "后备文案");
  assert.equal(translator.t("missing.key"), "missing.key");

  translator.setLocale("zh-CN");
  assert.equal(translator.locale, "zh-CN");
  assert.equal(translator.t("greeting", { name: "Bobby" }), "你好 Bobby");
});
