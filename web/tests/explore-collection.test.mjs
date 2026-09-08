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

test("Explore 通用组件只消费 collection 展示合同", () => {
  const sources = [
    "ExplorePage.vue",
    "ExploreChapterCard.vue",
    "ExploreMapCard.vue",
    "ExploreUngroupedMaps.vue",
    "levelFilters.ts",
  ].map((name) =>
    fs.readFileSync(
      new URL(`../src/pages/explore/${name}`, import.meta.url),
      "utf8",
    ),
  );

  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /original|原版|萝卜数|special-scenes?|bonus-level|map\.kind|chapter\.kind/i,
    );
  }
  assert.equal(
    fs.existsSync(
      new URL(
        "../src/pages/explore/ExploreUngroupedMaps.vue",
        import.meta.url,
      ),
    ),
    true,
  );
  assert.equal(
    fs.existsSync(
      new URL("../src/pages/explore/DifficultyLegend.vue", import.meta.url),
    ),
    false,
  );
});
