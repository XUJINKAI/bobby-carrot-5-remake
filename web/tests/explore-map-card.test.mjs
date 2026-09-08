import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

const component = fs.readFileSync(
  new URL("../src/pages/explore/ExploreMapCard.vue", import.meta.url),
  "utf8",
);

test("Explore 地图卡片原样显示 collection 提供的地图名称", () => {
  assert.match(component, /\{\{ map\.name \}\}/);
  assert.doesNotMatch(component, /primaryLabel|secondaryLabel|map\.id\.split/);
});
