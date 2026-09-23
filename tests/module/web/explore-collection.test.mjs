import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

test("Explore 标题直接显示 collection 地图总数", () => {
  const explorePage = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExplorePage.vue", import.meta.url),
    "utf8",
  );
  const exploreHeader = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExploreHeader.vue", import.meta.url),
    "utf8",
  );

  assert.match(explorePage, /:map-count="activeCollection\.maps\.length"/);
  assert.match(exploreHeader, /webT\("explore\.levelCount", \{ count: mapCount \}\)/);
});

test("Explore collection 文案按 ID 本地化并支持可选 tag", () => {
  const explorePage = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExplorePage.vue", import.meta.url),
    "utf8",
  );
  const exploreTabs = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExploreTabs.vue", import.meta.url),
    "utf8",
  );

  assert.match(explorePage, /collectionName\(activeCollection\.id\)/);
  assert.match(explorePage, /collectionDescription\(activeCollection\.id\)/);
  assert.match(exploreTabs, /tag: collectionTag\(collection\.id\)/);
  assert.match(exploreTabs, /v-if="collection\.tag"/);
  assert.match(exploreTabs, /justify-content:\s*center/);
});

test("Explore chapter 只显示 collection 提供的展示名称", () => {
  const chapterCard = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExploreChapterCard.vue", import.meta.url),
    "utf8",
  );
  const explorePage = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExplorePage.vue", import.meta.url),
    "utf8",
  );

  assert.match(chapterCard, /\{\{ chapter\.name \}\}/);
  assert.doesNotMatch(chapterCard, /\{\{ chapter\.id \}\}/);
  assert.doesNotMatch(chapterCard, /class="chapter-id"/);
  assert.doesNotMatch(chapterCard, /class="chapter-separator"/);
  assert.doesNotMatch(chapterCard, /text-transform:\s*uppercase/);
  assert.match(
    explorePage,
    /\.collection-sections,\s*\.chapter-list\s*\{\s*display:\s*grid;\s*gap:\s*14px;/,
  );
});

test("Explore 难度星级颜色随应用基础样式加载", () => {
  const chapterCard = fs.readFileSync(
    new URL("../../../web/src/pages/explore/ExploreChapterCard.vue", import.meta.url),
    "utf8",
  );
  const globalStyle = fs.readFileSync(
    new URL("../../../web/style.css", import.meta.url),
    "utf8",
  );
  const adventureViewport = fs.readFileSync(
    new URL("../../../web/src/pages/adventure/AdventureViewport.vue", import.meta.url),
    "utf8",
  );

  assert.match(chapterCard, /class="chapter-stars"/);
  assert.match(
    globalStyle,
    /\.chapter-stars\s*\{[^}]*color:\s*#f7d45f;/s,
  );
  assert.doesNotMatch(adventureViewport, /\.chapter-stars\s*\{/);
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
      new URL(`../../../web/src/pages/explore/${name}`, import.meta.url),
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
        "../../../web/src/pages/explore/ExploreUngroupedMaps.vue",
        import.meta.url,
      ),
    ),
    true,
  );
  assert.equal(
    fs.existsSync(
      new URL("../../../web/src/pages/explore/DifficultyLegend.vue", import.meta.url),
    ),
    false,
  );
});


test("Explore imperative filters follow page locale lifecycle", () => {
  const mount = fs.readFileSync(
    new URL("../../../web/src/pages/explore/mountExplorePage.ts", import.meta.url),
    "utf8",
  );
  const filters = fs.readFileSync(
    new URL("../../../web/src/pages/explore/levelFilters.ts", import.meta.url),
    "utf8",
  );

  assert.match(filters, /export interface LevelFilterController/);
  assert.match(
    filters,
    /localeChanged\(\): void \{[\s\S]*renderFilterShell\(shell\);[\s\S]*applyFilters\(\);/,
  );
  assert.match(
    filters,
    /destroy\(\): void \{[\s\S]*removeEventListener\("click", onFilterClick\)[\s\S]*shell\.remove\(\)/,
  );
  assert.match(
    mount,
    /const filters = collection\.filters\.length > 0[\s\S]*mountLevelFilters\(collection, images\)/,
  );
  assert.match(
    mount,
    /localeChanged\(\): void \{[\s\S]*syncShell\(\);[\s\S]*filters\?\.localeChanged\(\)/,
  );
  assert.match(
    mount,
    /destroy\(\): void \{[\s\S]*filters\?\.destroy\(\);[\s\S]*exploreApp\.unmount\(\)/,
  );
});
