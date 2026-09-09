import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import {
  musicActionIcon,
  repositoryAction,
} from "../src/app/pageChrome.ts";

test("音乐操作根据开关状态使用扬声器图标", () => {
  assert.equal(musicActionIcon(true), "sound-on");
  assert.equal(musicActionIcon(false), "sound-off");
});

test("首页 GitHub 入口在移动端保持外露", () => {
  assert.equal(repositoryAction().collapse, "keep");
});

test("首页开发状态在移动端保持显示", () => {
  const source = readFileSync(
    new URL("../src/shell/ShellIdentity.vue", import.meta.url),
    "utf8",
  );
  const compactRule = source.match(
    /@media \(max-width: 900px\) \{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

  assert.match(compactRule, /\.shell-product-name/);
  assert.doesNotMatch(compactRule, /\.shell-status-text/);
});
