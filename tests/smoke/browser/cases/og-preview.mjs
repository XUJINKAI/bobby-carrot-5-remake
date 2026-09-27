import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { root } from "../../../../tools/lib/fs.mjs";
import { waitForBrowserState } from "./source/browser-regression-wait.mjs";

export async function runOgPreviewSmoke(cdp) {
  const source = pathToFileURL(path.join(root, "tools/seo/og-preview.html"));
  for (const [query, locale, features, font] of [
    ["", "en", ["480 Levels +", "Play in Browser", "Map Editor"], "Jersey 10"],
    ["?lang=en", "en", ["480 Levels +", "Play in Browser", "Map Editor"], "Jersey 10"],
    ["?lang=zh-CN", "zh-CN", ["480 关卡 +", "浏览器畅玩", "地图编辑器"], "Noto Sans SC Share"],
  ]) {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    try {
      await cdp.send("Page.enable", {}, sessionId);
      await cdp.send("Runtime.enable", {}, sessionId);
      const url = `${source.href}${query}`;
      await cdp.send("Page.navigate", { url }, sessionId);
      await waitForBrowserState(async () => await cdp.evaluate(sessionId, `
        location.href === ${JSON.stringify(url)} && document.readyState === "complete"
      `));
      await cdp.send("Runtime.evaluate", {
        expression: "document.fonts.ready",
        awaitPromise: true,
      }, sessionId);
      const state = await cdp.evaluate(sessionId, `(() => {
        const board = document.querySelector('.artboard').getBoundingClientRect();
        return {
          locale: document.documentElement.lang,
          width: board.width,
          height: board.height,
          features: [...document.querySelectorAll('.features li')].map((item) => item.textContent.trim()),
          imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
          fontLoaded: [...document.fonts].some((face) => face.family.replaceAll('"', '') === ${JSON.stringify(font)} && face.status === 'loaded'),
          captionCount: document.querySelectorAll('figcaption').length,
          logoFilter: getComputedStyle(document.querySelector('.logo')).filter,
          frameShadow: getComputedStyle(document.querySelector('.gameplay-frame')).boxShadow,
        };
      })()`);
      assert.deepEqual(state, {
        locale,
        width: 1200,
        height: 630,
        features,
        imagesLoaded: true,
        fontLoaded: true,
        captionCount: 0,
        logoFilter: "none",
        frameShadow: "none",
      });
    } finally {
      await cdp.send("Target.closeTarget", { targetId });
    }
  }
}
