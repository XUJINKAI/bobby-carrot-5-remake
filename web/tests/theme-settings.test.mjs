import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import {
  resolveMusicMode,
  resolveMusicStyle,
  resolveVolume,
} from "../src/app/settings/globalPreferences.ts";
import { resolveWebTheme } from "../src/theme/webTheme.ts";

test("Bobby is the default web theme", () => {
  assert.equal(resolveWebTheme(null), "bobby");
  assert.equal(resolveWebTheme("bobby"), "bobby");
  assert.equal(resolveWebTheme("fc"), "fc");
  assert.equal(resolveWebTheme("modern"), "bobby");
  assert.equal(resolveWebTheme("retro"), "bobby");
});

test("follow-theme music maps Bobby to modern audio and FC to 8bit", () => {
  assert.equal(resolveMusicStyle("bobby", "follow-theme"), "modern");
  assert.equal(resolveMusicStyle("fc", "follow-theme"), "8bit");
  assert.equal(resolveMusicStyle("fc", "modern"), "modern");
  assert.equal(resolveMusicStyle("bobby", "8bit"), "8bit");
});

test("music mode and volume use stable defaults", () => {
  assert.equal(resolveMusicMode(null), "follow-theme");
  assert.equal(resolveMusicMode("modern"), "modern");
  assert.equal(resolveMusicMode("8bit"), "8bit");
  assert.equal(resolveVolume(null), 100);
  assert.equal(resolveVolume("150"), 150);
  assert.equal(resolveVolume("250"), 200);
  assert.equal(resolveVolume("-10"), 0);
  assert.equal(resolveVolume("invalid"), 100);
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
