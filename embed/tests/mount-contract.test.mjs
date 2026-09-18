import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Embed 配置不包含未实现的主题入口", async () => {
  const [typesSource, mountSource] = await Promise.all([
    readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(typesSource, /\btheme\??:/);
  assert.doesNotMatch(mountSource, /dataset\.theme/);
});

test("Embed 服从 LevelMap 的地图音乐选择", async () => {
  const mountSource = await readFile(
    new URL("../src/mount.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(mountSource, /playMusic\(["']ingame1["']\)/);
});
