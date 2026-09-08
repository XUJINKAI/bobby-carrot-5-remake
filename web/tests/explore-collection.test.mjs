import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

test("Explore 标题直接显示 collection 地图总数", () => {
  const explorePage = fs.readFileSync(
    new URL("../src/pages/explore/ExplorePage.vue", import.meta.url),
    "utf8",
  );
  const exploreHeader = fs.readFileSync(
    new URL("../src/pages/explore/ExploreHeader.vue", import.meta.url),
    "utf8",
  );

  assert.match(explorePage, /:map-count="activeCollection\.maps\.length"/);
  assert.match(exploreHeader, /\{\{ mapCount \}\} 关/);
});

test("Explore chapter 原样显示可选名称并统一混合布局间距", () => {
  const chapterCard = fs.readFileSync(
    new URL("../src/pages/explore/ExploreChapterCard.vue", import.meta.url),
    "utf8",
  );
  const explorePage = fs.readFileSync(
    new URL("../src/pages/explore/ExplorePage.vue", import.meta.url),
    "utf8",
  );

  assert.match(chapterCard, /v-if="chapter\.name !== undefined"/);
  assert.match(chapterCard, /\{\{ chapter\.name \}\}/);
  assert.doesNotMatch(chapterCard, /text-transform:\s*uppercase/);
  assert.match(
    explorePage,
    /\.collection-sections,\s*\.chapter-list\s*\{\s*display:\s*grid;\s*gap:\s*14px;/,
  );
});
