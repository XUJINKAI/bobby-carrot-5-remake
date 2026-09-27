import assert from "node:assert/strict";
import { test } from "vitest";
import {
  collectionSeoDescriptor,
  localizedSeoDescriptor,
  bilingualSeoDescriptor,
  staticSeoDescriptor,
} from "../../../web/src/seo/seoDescriptors.js";
import { homeLocale, homePath } from "../../../web/src/app/homeRoutes.js";
import { shareImage } from "../../../web/src/seo/shareImage.js";

test("分享图：首页按地址选择语言，内页按当前语言选择，构建默认中文", () => {
  for (const [path, preference, expected] of [
    ["/", "en", "zh-CN"],
    ["/en", "zh-CN", "en"],
    ["/en/", "zh-CN", "en"],
    ["/explore", "en", "en"],
    ["/edit", "zh-CN", "zh-CN"],
    ["/adventure/play/1-1", undefined, "zh-CN"],
  ]) {
    const image = shareImage(path, preference);
    assert.equal(image.path, `/assets/seo/og-preview-${expected}.png`);
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    assert.ok(image.alt.includes(expected === "en" ? "Bobby Carrot 5 Remake" : "兔子波比5重制版"));
  }
});

test("首页地址确定 metadata 语言，应用内页沿用当前语言", () => {
  for (const [path, locale, title] of [
    ["/", "zh-CN", "兔子波比5重制版 - 在线玩"],
    ["/en", "en", "Bobby Carrot 5 Remake - Play Online"],
  ]) {
    const descriptor = staticSeoDescriptor(path);
    assert.equal(homeLocale(path), locale);
    assert.equal(homePath(locale), path);
    assert.equal(bilingualSeoDescriptor(descriptor).title, title);
    for (const preference of ["en", "zh-CN"]) {
      const resolved = localizedSeoDescriptor(descriptor, preference);
      assert.equal(resolved.title, title);
      assert.equal(resolved.canonicalPath, path);
    }
  }
  assert.equal(homeLocale("/en/"), "en");
  assert.equal(homeLocale("/en/explore"), null);
  assert.equal(homeLocale("/explore"), null);
  assert.equal(
    localizedSeoDescriptor(staticSeoDescriptor("/edit"), "en").canonicalPath,
    "/edit",
  );
  assert.equal(
    localizedSeoDescriptor(staticSeoDescriptor("/edit"), "en").title,
    "Map Editor | Bobby Carrot 5 Remake",
  );
});

test("Collection SEO 按 ID 读取双语名称与说明", () => {
  const descriptor = collectionSeoDescriptor("/explore/loma", {
    id: "loma",
  });

  assert.deepEqual(localizedSeoDescriptor(descriptor, "zh-CN"), {
    title: "LOMA | 自由探索 | 兔子波比5重制版",
    description: "Levels Of Many Authors：137 张三箱 Sokoban 地图。",
    canonicalPath: "/explore/loma",
    index: true,
  });
  assert.deepEqual(localizedSeoDescriptor(descriptor, "en"), {
    title: "LOMA | Explore | Bobby Carrot 5 Remake",
    description: "Levels Of Many Authors: 137 Sokoban maps with three boxes each.",
    canonicalPath: "/explore/loma",
    index: true,
  });
});
