import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { exploreCollectionSummary } from "../src/pages/explore/collectionSummary.ts";

test("Original Explore 摘要分别统计正式章节与 Special Scene", () => {
  const collection = {
    schemaVersion: 1,
    name: "原版关卡",
    cardSize: "small",
    filters: [],
    chapters: [
      { id: "40", name: "THE END" },
      { id: "special-scenes", name: "Special Scenes", kind: "special-scenes" },
    ],
    maps: [
      { id: "40-10", name: "10", chapter: "40", kind: "level" },
      {
        id: "beaver-shop",
        name: "Beaver Shop",
        chapter: "special-scenes",
        kind: "special-scene",
      },
    ],
  };

  assert.equal(
    exploreCollectionSummary(collection),
    "1 章 · 1 关 · 1 个 Special Scene",
  );
  assert.equal(
    exploreCollectionSummary(collection, {
      chapters: 1,
      maps: 1,
      campaignMaps: 0,
      specialScenes: 1,
    }),
    "1 / 1 章 · 0 / 1 关 · 1 / 1 个 Special Scene",
  );
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
