import assert from "node:assert/strict";
import { test } from "vitest";
import { musicActionIcon } from "../src/app/pageChrome.ts";

test("音乐操作根据开关状态使用扬声器图标", () => {
  assert.equal(musicActionIcon(true), "sound-on");
  assert.equal(musicActionIcon(false), "sound-off");
});
