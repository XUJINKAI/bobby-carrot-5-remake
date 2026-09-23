import assert from "node:assert/strict";
import { test } from "vitest";
import {
  collectionSeoDescriptor,
  localizedSeoDescriptor,
} from "../../../web/src/seo/seoDescriptors.js";

test("Collection SEO 按 ID 读取双语名称与说明", () => {
  const descriptor = collectionSeoDescriptor("/explore/loma-pushbox", {
    id: "loma-pushbox",
  });

  assert.deepEqual(localizedSeoDescriptor(descriptor, "zh-CN"), {
    title: "LOMA | 自由探索 | 兔子波比5重制版",
    description: "Levels Of Many Authors：137 张三箱 Sokoban 地图。",
    canonicalPath: "/explore/loma-pushbox",
    index: true,
  });
  assert.deepEqual(localizedSeoDescriptor(descriptor, "en"), {
    title: "LOMA | Explore | Bobby Carrot 5 Remake",
    description: "Levels Of Many Authors: 137 Sokoban maps with three boxes each.",
    canonicalPath: "/explore/loma-pushbox",
    index: true,
  });
});
