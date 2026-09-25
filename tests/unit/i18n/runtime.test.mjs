import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  COLLECTION_CATALOGS,
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
  assert.equal(translator.has("greeting"), true);
  assert.equal(translator.has("missing.key"), false);

  translator.setLocale("zh-CN");
  assert.equal(translator.locale, "zh-CN");
});

test("translator reads ordered dialogue arrays without changing string lookup", () => {
  const translator = createTranslator({
    locale: "en",
    fallbackLocale: "zh-CN",
    catalogs: {
      en: { sequence: ["Hello {name}", "Good luck"] },
      "zh-CN": { sequence: ["你好，{name}", "祝你好运"] },
    },
  });
  assert.deepEqual(translator.tArray("sequence", { name: "Bobby" }), [
    "Hello Bobby",
    "Good luck",
  ]);
  assert.throws(() => translator.t("sequence"), /字符串数组/);
  translator.setLocale("zh-CN");
  assert.deepEqual(translator.tArray("sequence", { name: "Bobby" }), [
    "你好，Bobby",
    "祝你好运",
  ]);
});

test("scoped catalogs load independently by locale", async () => {
  const [zh, en] = await Promise.all([
    loadTranslationCatalog("shell", "zh-CN"),
    loadTranslationCatalog("shell", "en"),
  ]);
  assert.equal(zh["shell.settings"], "设置");
  assert.equal(en["shell.settings"], "Settings");
});

test("multi-page dialogue catalogs keep key, shape and page parity", async () => {
  for (const scope of ["home", "adventure"]) {
    const [zh, en] = await Promise.all([
      loadTranslationCatalog(scope, "zh-CN"),
      loadTranslationCatalog(scope, "en"),
    ]);
    const keys = Object.keys(zh).filter((key) => key.includes(".dialogue."));
    assert.deepEqual(keys, Object.keys(en).filter((key) => key.includes(".dialogue.")));
    for (const key of keys) {
      assert.equal(Array.isArray(en[key]), Array.isArray(zh[key]), key);
      if (Array.isArray(zh[key]))
        assert.equal(en[key].length, zh[key].length, key);
    }
  }
});

test("collection catalogs use manifest IDs and keep optional tag parity", async () => {
  const manifest = JSON.parse(
    fs.readFileSync(
      new URL("../../../tools/assets/collections.json", import.meta.url),
      "utf8",
    ),
  );
  const loaded = await loadTranslationCatalog("collections", "zh-CN");

  for (const { id } of manifest.collections) {
    const prefix = `collections.${id}.`;
    const zhKeys = Object.keys(COLLECTION_CATALOGS["zh-CN"])
      .filter((key) => key.startsWith(prefix));
    const enKeys = Object.keys(COLLECTION_CATALOGS.en)
      .filter((key) => key.startsWith(prefix));
    const hasZhTag = zhKeys.includes(`${prefix}tag`);
    const hasEnTag = enKeys.includes(`${prefix}tag`);
    assert.equal(hasZhTag, hasEnTag);
    const required = [`${prefix}name`, `${prefix}description`];

    assert.deepEqual(zhKeys, enKeys);
    for (const key of required) {
      assert.ok(COLLECTION_CATALOGS["zh-CN"][key]);
      assert.ok(COLLECTION_CATALOGS.en[key]);
    }
  }
  assert.equal(
    loaded["collections.loma.tag"],
    "推箱子",
  );
  assert.equal(
    COLLECTION_CATALOGS["zh-CN"]["collections.original.filters.mechanics.options.bean"],
    "魔豆",
  );
  assert.equal(
    COLLECTION_CATALOGS.en["collections.original.filters.mechanics.options.bean"],
    "Magic Bean",
  );
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
