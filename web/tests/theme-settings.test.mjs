import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { resolveMusicStyle } from "../src/app/settings/globalPreferences.ts";

test("follow-theme music maps Bobby to modern audio and FC to 8bit", () => {
  assert.equal(resolveMusicStyle("bobby", "follow-theme"), "modern");
  assert.equal(resolveMusicStyle("fc", "follow-theme"), "8bit");
  assert.equal(resolveMusicStyle("fc", "modern"), "modern");
  assert.equal(resolveMusicStyle("bobby", "8bit"), "8bit");
});

test("FC 主题使用彩色 8-bit 调色板", () => {
  const css = fs.readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const fc = css.match(/html\[data-theme="fc"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(fc, /--bc-bg:\s*#07155e/);
  assert.match(fc, /--bc-panel:\s*#142a8a/);
  assert.match(fc, /--bc-control:\s*#17339b/);
  assert.match(fc, /--bc-text:\s*#fff/);
  assert.match(fc, /--bc-panel-border:\s*#a9d7ff/);
});

test("FC 首页不渲染星空画布", () => {
  const home = fs.readFileSync(
    new URL("../src/pages/home/HomePage.vue", import.meta.url),
    "utf8",
  );
  assert.match(home, /v-if="theme !== 'fc'"/);
});
