import assert from "node:assert/strict";
import { test } from "vitest";
import {
  resolveMusicMode,
  resolveMusicStyle,
  resolveVolume,
} from "../src/app/settings/globalPreferences.ts";
import { resolveWebTheme } from "../src/theme/webTheme.ts";

test("modern is the default web theme", () => {
  assert.equal(resolveWebTheme(null), "modern");
  assert.equal(resolveWebTheme("modern"), "modern");
  assert.equal(resolveWebTheme("retro"), "retro");
});

test("follow-theme music maps modern to modern and retro to 8bit", () => {
  assert.equal(resolveMusicStyle("modern", "follow-theme"), "modern");
  assert.equal(resolveMusicStyle("retro", "follow-theme"), "8bit");
  assert.equal(resolveMusicStyle("retro", "modern"), "modern");
  assert.equal(resolveMusicStyle("modern", "8bit"), "8bit");
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
