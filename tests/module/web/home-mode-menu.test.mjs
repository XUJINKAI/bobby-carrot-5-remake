import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("首页模式入口使用同级样式并说明各自能力", async () => {
  const [menu, zhCatalog, enCatalog] = await Promise.all([
    readFile(
      new URL("../../../web/src/pages/home/HomeModeMenu.vue", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../i18n/src/locales/home/zh-CN.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../i18n/src/locales/home/en.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(menu, /home-mode-card primary/);
  assert.doesNotMatch(menu, /\.home-mode-card\.primary/);
  assert.match(menu, /\.home-embed-link\s*\{[\s\S]*font-size: 0\.86rem/);
  assert.match(
    zhCatalog,
    /"home\.adventureDescription": "强制竖屏，禁止撤销，原版关卡体验"/,
  );
  assert.match(
    zhCatalog,
    /"home\.exploreDescription": "任意选关，扩展关卡，录像调试"/,
  );
  assert.match(
    zhCatalog,
    /"home\.editorDescription": "编辑地图，通过链接或内嵌等方式分享"/,
  );
  assert.match(enCatalog, /"home\.adventureDescription": "Portrait only, no undo/);
  assert.match(enCatalog, /"home\.exploreDescription": "Choose any level/);
  assert.match(enCatalog, /"home\.editorDescription": "Edit maps and share them/);
});
