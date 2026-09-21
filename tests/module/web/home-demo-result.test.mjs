import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("首页 Demo 通关后显示仓库操作并由 frame 提供重新开始", async () => {
  const [mount, page, demo, types, zhCatalog] = await Promise.all([
    readFile(
      new URL("../../../web/src/pages/home/mountHomePage.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../web/src/pages/home/HomePage.vue", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../web/src/pages/home/HomeDemo.vue", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../web/src/pages/home/types.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../i18n/src/locales/home/zh-CN.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(mount, /state\.status === "won"\s*\? "complete"/);
  assert.match(mount, /state\.status === "won"[\s\S]*webT\("home\.demoMove"\)/);
  assert.doesNotMatch(mount, /loadAdventureSave|navigatingToAdventure/);
  assert.match(mount, /repositoryUrl: PROJECT_REPOSITORY_URL/);
  assert.match(page, /:repository-url="repositoryUrl"/);
  assert.match(types, /demoResult: "complete" \| "death" \| null/);

  assert.match(demo, /class="home-demo-toolbar"[\s\S]*class="home-demo-restart"/);
  assert.match(demo, /<AppIcon name="restart" \/>/);
  assert.doesNotMatch(demo, /primary-btn/);
  assert.match(demo, /target="_blank"/);
  assert.match(demo, /webT\("home\.demoRepository"\)/);
  assert.match(demo, /@click="emit\('restart'\)"/);
  assert.match(demo, /\.result-card h2\s*\{\s*font-size: 0\.92rem/);
  assert.match(
    zhCatalog,
    /"home\.demoComplete": "喜欢的话给个star或分享出去吧~"/,
  );
  assert.doesNotMatch(zhCatalog, /home\.demoCompleteStatus/);
  assert.match(zhCatalog, /"home\.demoRepository": "前往仓库"/);
});
