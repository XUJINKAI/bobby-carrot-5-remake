import assert from "node:assert/strict";
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
