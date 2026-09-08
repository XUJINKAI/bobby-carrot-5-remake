import assert from "node:assert/strict";
import test from "node:test";
import {
  isCollectionVisible,
  normalizeCollectionVisibility,
} from "./collection-visibility.mjs";

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
