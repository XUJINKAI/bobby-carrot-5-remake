import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveBrowserLocale } from "../src/i18n/webI18n.ts";

test("browser locale resolves supported language families", () => {
  assert.equal(resolveBrowserLocale(["ja-JP", "zh-Hans-CN"]), "zh-CN");
  assert.equal(resolveBrowserLocale(["en-GB"]), "en");
});

test("unsupported locale preferences fall back to English", () => {
  assert.equal(resolveBrowserLocale(["ja-JP", "de-DE"]), "en");
});
