import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "vitest";

const fontDirectory = new URL(
  "../../../assets/ui/fonts/jersey-10/",
  import.meta.url,
);

test("Jersey 10 字体与许可证封装在共享目录", async () => {
  const [fontInfo, compressedFontInfo, license] = await Promise.all([
    stat(new URL("Jersey10-Regular.ttf", fontDirectory)),
    stat(new URL("Jersey10-Regular.woff2", fontDirectory)),
    readFile(new URL("OFL.txt", fontDirectory), "utf8"),
  ]);

  assert.ok(fontInfo.size > 0);
  assert.ok(compressedFontInfo.size > 0);
  assert.ok(compressedFontInfo.size < fontInfo.size);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("Web 入口加载共享 Jersey 10 字体定义", async () => {
  const [fontCss, appSource] = await Promise.all([
    readFile(new URL("font.css", fontDirectory), "utf8"),
    readFile(new URL("../../../web/src/app.ts", import.meta.url), "utf8"),
  ]);

  assert.match(fontCss, /font-family: "Jersey 10"/);
  assert.match(fontCss, /url\("\.\/Jersey10-Regular\.woff2"\) format\("woff2"\)/);
  assert.match(appSource, /assets\/ui\/fonts\/jersey-10\/font\.css/);
});

test("Embed 在 Shadow DOM 内应用 Jersey 10 HUD 主题", async () => {
  const [mountSource, assetSource] = await Promise.all([
    readFile(new URL("../../../embed/src/mount.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../../../embed/src/runtimeAssets.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(assetSource, /Jersey10-Regular\.woff2/);
  assert.match(assetSource, /new FontFace\(/);
  assert.match(assetSource, /document\.fonts\.add\(face\)/);
  assert.match(mountSource, /loadEmbedJerseyFont\(\)/);
  assert.doesNotMatch(mountSource, /@font-face/);
  assert.match(mountSource, /\.engine-gameplay-hud \{/);
  assert.match(
    mountSource,
    /font-family: "BC5R Jersey 10", "Jersey 10", fantasy/,
  );
  assert.match(mountSource, /-webkit-text-stroke: 1px #000/);
  assert.match(
    mountSource,
    /--engine-gameplay-hud-value-font-size: 36px/,
  );
});

test("Web 为 Engine 游戏 HUD 应用 Jersey 10 主题", async () => {
  const gameUiCss = await readFile(
    new URL("../../../web/game-ui.css", import.meta.url),
    "utf8",
  );

  assert.match(gameUiCss, /\.engine-gameplay-hud \{/);
  assert.match(gameUiCss, /font-family: "Jersey 10", fantasy/);
  assert.match(gameUiCss, /-webkit-text-stroke: 1px #000/);
  assert.match(gameUiCss, /text-shadow:/);
  assert.match(
    gameUiCss,
    /--engine-gameplay-hud-value-font-size: 36px/,
  );
});
