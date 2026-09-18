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

test("Embed 把 Pointer 与键盘缩放能力交给 Engine Input", async () => {
  const [typesSource, mountSource] = await Promise.all([
    readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/mount.ts", import.meta.url), "utf8"),
  ]);

  assert.match(typesSource, /pointer\?: boolean/);
  assert.match(typesSource, /EmbedKeyboardMode = "focus" \| "global"/);
  assert.doesNotMatch(typesSource, /EmbedKeyboardMode = [^;]*false/);
  assert.match(
    mountSource,
    /options\.input\?\.keyboard === "global" \? "global" : "focus"/,
  );
  assert.match(mountSource, /options\.input\?\.pointer \?\? true/);
  assert.match(mountSource, /\bpointer,/);
  assert.match(mountSource, /zoom: true/);
});

test("Embed 框架使用固定首页、地图打开动作与操作提示", async () => {
  const mountSource = await readFile(
    new URL("../src/mount.ts", import.meta.url),
    "utf8",
  );

  assert.match(mountSource, /https:\/\/bc5r\.xujinkai\.net\//);
  assert.match(mountSource, /frameControls\.open\.href = playUrl/);
  assert.match(mountSource, /runtime\.game\.restart\(\)/);
  assert.match(
    mountSource,
    /createOriginalGameplayImageManager\(embedArtUrl\)/,
  );
  assert.doesNotMatch(mountSource, /"bobby-left":/);
  assert.match(mountSource, /WASD \/ 方向键移动/);
});

test("Embed 服从 LevelMap 的地图音乐选择", async () => {
  const mountSource = await readFile(
    new URL("../src/mount.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(mountSource, /playMusic\(["']ingame1["']\)/);
});
