import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveGameMusic } from "../src/pages/game/gameMusic.ts";

test("未指定音乐的普通地图随机选择游戏曲目", () => {
  assert.equal(
    resolveGameMusic(undefined, { specialScene: false }, () => 0),
    "ingame0",
  );
  assert.equal(
    resolveGameMusic(undefined, { specialScene: false }, () => 0.5),
    "ingame1",
  );
  assert.equal(
    resolveGameMusic("random", { specialScene: false }, () => 0.999),
    "ingame2",
  );
  assert.equal(
    resolveGameMusic(undefined, { specialScene: true }, () => 0),
    "title",
  );
});

test("地图音乐字段优先于页面默认值", () => {
  assert.equal(
    resolveGameMusic("bonus", { specialScene: false }),
    "bonus",
  );
  assert.equal(
    resolveGameMusic("none", { specialScene: true }),
    null,
  );
});
