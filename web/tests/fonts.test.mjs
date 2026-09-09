import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "vitest";

const fontDirectory = new URL(
  "../src/shared/fonts/jersey-10/",
  import.meta.url,
);

test("Jersey 10 字体与许可证封装在共享目录", async () => {
  const [fontInfo, license] = await Promise.all([
    stat(new URL("Jersey10-Regular.ttf", fontDirectory)),
    readFile(new URL("OFL.txt", fontDirectory), "utf8"),
  ]);

  assert.ok(fontInfo.size > 0);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("Web 入口加载共享 Jersey 10 字体定义", async () => {
  const [fontCss, appSource] = await Promise.all([
    readFile(new URL("font.css", fontDirectory), "utf8"),
    readFile(new URL("../src/app.ts", import.meta.url), "utf8"),
  ]);

  assert.match(fontCss, /font-family: "Jersey 10"/);
  assert.match(fontCss, /url\("\.\/Jersey10-Regular\.ttf"\)/);
  assert.match(appSource, /shared\/fonts\/jersey-10\/font\.css/);
});
