import assert from "node:assert/strict";
import test from "node:test";
import {
  createTranslator,
  loadTranslationCatalog,
  normalizeLocale,
  SEO_CATALOGS,
} from "../../../i18n/dist/index.js";
import { createCatalogStore } from "../../../i18n/dist/catalogStore.js";

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

test("SEO catalogs are static bilingual resources", () => {
  assert.equal(
    SEO_CATALOGS["zh-CN"]["seo.settings.title"],
    "设置 | 兔子波比5重制版",
  );
  assert.equal(
    SEO_CATALOGS.en["seo.settings.title"],
    "Settings | Bobby Carrot 5 Remake",
  );
});

test("catalog store retries after a failed load without poisoning the cache", async () => {
  const store = createCatalogStore();
  let attempts = 0;
  const loader = async () => {
    attempts++;
    if (attempts === 1) throw new Error("temporary failure");
    return { greeting: "Hello" };
  };

  await assert.rejects(store.load("scope:en", loader), /temporary failure/);
  assert.deepEqual(await store.load("scope:en", loader), { greeting: "Hello" });
  assert.equal(attempts, 2);
  assert.deepEqual(
    await store.load("scope:en", () => Promise.resolve({ greeting: "Other" })),
    { greeting: "Hello" },
  );
});
