import assert from "node:assert/strict";
import test from "node:test";
import {
  isCollectionVisible,
  normalizeCollectionVisibility,
} from "../../../tools/custom/collection-visibility.mjs";
import {
  visibleCollectionSummaries,
} from "../../../tools/assets/collection/manifest.mjs";

test("collection visible 缺省为公开展示", () => {
  assert.equal(normalizeCollectionVisibility(undefined, "sample"), true);
  assert.equal(isCollectionVisible(true, false), true);
  assert.equal(isCollectionVisible(true, true), true);
});

test("collection visible 支持隐藏和仅开发环境展示", () => {
  assert.equal(isCollectionVisible(false, false), false);
  assert.equal(isCollectionVisible(false, true), false);
  assert.equal(isCollectionVisible("dev", false), false);
  assert.equal(isCollectionVisible("dev", true), true);
});

test("collection visible 拒绝其它值", () => {
  assert.throws(
    () => normalizeCollectionVisibility("preview", "sample"),
    /visible 必须是 true \/ false \/ "dev"/,
  );
});

test("开发集合保持内部顺序并统一排在普通集合之后", () => {
  const collections = [
    { id: "dev-a", visible: "dev" },
    { id: "public-a", visible: true },
    { id: "hidden", visible: false },
    { id: "public-b", visible: true },
    { id: "dev-b", visible: "dev" },
  ];

  assert.deepEqual(
    visibleCollectionSummaries({ collections }, false).map(({ id }) => id),
    ["public-a", "public-b"],
  );
  assert.deepEqual(
    visibleCollectionSummaries({ collections }, true).map(({ id }) => id),
    ["public-a", "public-b", "dev-a", "dev-b"],
  );
});
