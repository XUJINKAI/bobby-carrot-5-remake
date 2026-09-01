import assert from "node:assert/strict";
import { test } from "vitest";
import { resolvePreferredLocale } from "../src/i18n/webI18n.ts";

test("stored locale overrides browser preferences", () => {
  assert.equal(resolvePreferredLocale("zh-CN", ["en-US"]), "zh-CN");
  assert.equal(resolvePreferredLocale("en", ["zh-CN"]), "en");
});

test("browser locale resolves supported language families", () => {
  assert.equal(resolvePreferredLocale(null, ["ja-JP", "zh-Hans-CN"]), "zh-CN");
  assert.equal(resolvePreferredLocale(null, ["en-GB"]), "en");
});

test("unsupported locale preferences fall back to English", () => {
  assert.equal(resolvePreferredLocale(null, ["ja-JP", "de-DE"]), "en");
});
