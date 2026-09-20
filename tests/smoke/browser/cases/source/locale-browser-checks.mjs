import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyImportErrorFollowsLocale(cdp, sessionId) {
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('.import-card') && document.querySelector('#settings')",
        ),
      ),
    20_000,
  );

  await chooseLocale(cdp, sessionId, "中文", "zh-CN");
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.import-card p')?.textContent?.trim() ?? ''",
    )) === "数据 Payload 的 Base64 编码无效",
  );

  await chooseLocale(cdp, sessionId, "English", "en");
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.import-card p')?.textContent?.trim() ?? ''",
    )) === "Invalid Base64 data payload",
  );
}

export async function verifyLocaleSwitchPreservesGameSession(cdp, sessionId) {
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('#game') && document.querySelector('#settings') && document.querySelector('[data-replay-panel]')",
        ),
      ),
    20_000,
  );

  await chooseLocale(cdp, sessionId, "中文", "zh-CN");
  const initial = await cdp.evaluate(
    sessionId,
    `(() => {
      window.__localeRegressionCanvas = document.querySelector('#game');
      window.__localeRegressionStage = document.querySelector('[data-game-stage]');
      return {
        lang: document.documentElement.lang,
        canvas: Boolean(window.__localeRegressionCanvas),
        stage: Boolean(window.__localeRegressionStage),
        replay: document.querySelector('[data-replay-status]')?.textContent ?? '',
        mapStatus: document.querySelector('#map-status')?.getAttribute('aria-label') ?? '',
      };
    })()`,
  );
  if (
    initial.lang !== "zh-CN" ||
    !initial.canvas ||
    !initial.stage ||
    initial.replay !== "准备录制" ||
    !initial.mapStatus.startsWith("地图状态：")
  )
    throw new Error(
      `Locale regression failed to establish zh-CN state: ${JSON.stringify(initial)}`,
    );

  await chooseLocale(cdp, sessionId, "English", "en");
  await waitForLocaleState(cdp, sessionId, {
    locale: "en",
    replay: "Ready to record",
    mapStatusPrefix: "Map status:",
  });

  await chooseLocale(cdp, sessionId, "中文", "zh-CN");
  await waitForLocaleState(cdp, sessionId, {
    locale: "zh-CN",
    replay: "准备录制",
    mapStatusPrefix: "地图状态：",
  });
}

async function waitForLocaleState(
  cdp,
  sessionId,
  { locale, replay, mapStatusPrefix },
) {
  await waitForBrowserState(async () => {
    const state = await cdp.evaluate(
      sessionId,
      `(() => ({
        lang: document.documentElement.lang,
        sameCanvas: document.querySelector('#game') === window.__localeRegressionCanvas,
        sameStage: document.querySelector('[data-game-stage]') === window.__localeRegressionStage,
        replay: document.querySelector('[data-replay-status]')?.textContent ?? '',
        mapStatus: document.querySelector('#map-status')?.getAttribute('aria-label') ?? '',
      }))()`,
    );
    return (
      state.lang === locale &&
      state.sameCanvas &&
      state.sameStage &&
      state.replay === replay &&
      state.mapStatus.startsWith(mapStatusPrefix)
    );
  });
}

async function chooseLocale(cdp, sessionId, label, expectedLocale) {
  await clickWhenPresent(cdp, sessionId, "#settings");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-quick-settings-layer]')",
      ),
    ),
  );
  const clicked = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = [...document.querySelectorAll('.quick-settings-panel button[role="radio"]')]
        .find((item) => item.textContent?.trim() === ${JSON.stringify(label)});
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Quick Settings locale option missing: ${label}`);
  await waitForBrowserState(async () =>
    (await cdp.evaluate(sessionId, "document.documentElement.lang")) ===
    expectedLocale,
  );
}

async function clickWhenPresent(cdp, sessionId, selector) {
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const element = document.querySelector(${JSON.stringify(selector)});
          if (!element) return false;
          element.click();
          return true;
        })()`,
      ),
    ),
  );
}
