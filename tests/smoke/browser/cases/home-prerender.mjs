import assert from "node:assert/strict";
import { waitForBrowserState } from "./source/browser-regression-wait.mjs";

export async function runHomePrerenderSmoke(cdp, origin) {
  for (const [path, locale, title] of [
    ["/", "zh-CN", "兔子波比5重制版 - 在线玩"],
    ["/en", "en", "Bobby Carrot 5 Remake - Play Online"],
  ]) {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    try {
      await cdp.send("Page.enable", {}, sessionId);
      await cdp.send("Runtime.enable", {}, sessionId);
      await cdp.send("Network.enable", {}, sessionId);
      const analytics = ["https://www.googletagmanager.com/*", "https://www.google-analytics.com/*"];
      await cdp.send("Network.setBlockedURLs", { urls: analytics }, sessionId);
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
      await cdp.send("Page.navigate", { url: `${origin}${path}` }, sessionId);
      await waitForBrowserState(async () => await cdp.evaluate(sessionId,
        "document.readyState === 'complete' && Boolean(document.querySelector('.home-page h1'))",
      ));
      const initial = await cdp.evaluate(sessionId, `(() => {
        window.__homeNode = document.querySelector('.home-page');
        window.__homeHeading = document.querySelector('.home-page h1');
        window.__homeCanvas = document.querySelector('.home-demo-panel canvas');
        window.__homeErrors = [];
        const originalError = console.error;
        console.error = (...args) => {
          window.__homeErrors.push(args.map(String).join(' '));
          originalError(...args);
        };
        addEventListener('error', (event) => window.__homeErrors.push(event.message));
        addEventListener('unhandledrejection', (event) => window.__homeErrors.push(String(event.reason)));
        localStorage.setItem('bc5r:setting', JSON.stringify({
          schemaVersion: 1,
          locale: ${JSON.stringify(locale === "en" ? "zh-CN" : "en")},
          theme: 'fc',
          audio: { musicEnabled: false, musicMode: 'follow-theme', volume: 100 },
          controls: { screenControlEnabled: true },
          editor: { paletteSize: 48 },
        }));
        return {
          title: document.title,
          lang: document.documentElement.lang,
          styled: getComputedStyle(window.__homeNode).position === 'relative',
          interactive: Boolean(document.querySelector('[data-shell]')),
        };
      })()`);
      assert.deepEqual(initial, { title, lang: locale, styled: true, interactive: false });

      await cdp.send("Emulation.setScriptExecutionDisabled", { value: false }, sessionId);
      const loaded = await cdp.send("Runtime.evaluate", {
        expression: "import(document.querySelector('script[type=module][src]').src)",
        awaitPromise: true,
      }, sessionId);
      assert.equal(loaded.exceptionDetails, undefined, JSON.stringify(loaded));
      try {
        await waitForBrowserState(async () => await cdp.evaluate(sessionId,
          "Boolean(document.querySelector('[data-shell] .engine-screen-joystick-layer'))",
        ), 20_000);
      } catch (error) {
        throw new Error(JSON.stringify(await cdp.evaluate(sessionId,
          "({ errors: window.__homeErrors, body: document.body.innerHTML.slice(-2000) })",
        )), { cause: error });
      }
      const hydrated = await cdp.evaluate(sessionId, `({
        title: document.title,
        lang: document.documentElement.lang,
        samePage: window.__homeNode === document.querySelector('.home-page'),
        sameHeading: window.__homeHeading === document.querySelector('.home-page h1'),
        sameCanvas: window.__homeCanvas === document.querySelector('.home-demo-panel canvas'),
        savedLocale: JSON.parse(localStorage.getItem('bc5r:setting')).locale,
        errors: window.__homeErrors,
      })`);
      assert.deepEqual(hydrated, {
        title, lang: locale, samePage: true, sameHeading: true, sameCanvas: true,
        savedLocale: locale, errors: [],
      });
      await verifyLanguageButton(cdp, sessionId, locale, path, ".home-demo-panel canvas");

      await cdp.evaluate(sessionId, "document.querySelector('.home-mode-panel a[href=\"/explore\"]').click()");
      await waitForBrowserState(async () => await cdp.evaluate(sessionId,
        "location.pathname === '/explore' && Boolean(document.querySelector('.explore-tabs'))",
      ), 20_000);
      const interior = await cdp.evaluate(sessionId, `({
        lang: document.documentElement.lang,
        alternateCount: document.querySelectorAll('link[hreflang]').length,
        homeDataCount: document.querySelectorAll('script[data-home-structured-data]').length,
      })`);
      assert.deepEqual(interior, { lang: locale, alternateCount: 0, homeDataCount: 0 });
      await verifyLanguageButton(cdp, sessionId, locale, "/explore", ".explore-tabs");

      await cdp.evaluate(sessionId, "history.back()");
      await waitForBrowserState(async () => await cdp.evaluate(sessionId,
        `location.pathname === ${JSON.stringify(path)} && document.title === ${JSON.stringify(title)} && Boolean(document.querySelector('.home-demo-panel .engine-screen-joystick-layer'))`,
      ), 20_000);
      await cdp.evaluate(sessionId, "document.querySelector('#settings').click()");
      await waitForBrowserState(async () => await cdp.evaluate(sessionId,
        "Boolean(document.querySelector('.quick-settings-panel'))",
      ));
      const nextLocale = locale === "en" ? "zh-CN" : "en";
      const label = nextLocale === "en" ? "English" : "中文";
      await cdp.evaluate(sessionId, `(() => {
        window.__switchCanvas = document.querySelector('.home-demo-panel canvas');
        [...document.querySelectorAll('.quick-settings-panel button[role=radio]')]
          .find((button) => button.textContent.trim() === ${JSON.stringify(label)}).click();
      })()`);
      await waitForBrowserState(async () => await cdp.evaluate(sessionId,
        `document.documentElement.lang === ${JSON.stringify(nextLocale)} && location.pathname === ${JSON.stringify(nextLocale === "en" ? "/en" : "/")}`,
      ));
      assert.equal(await cdp.evaluate(sessionId,
        "window.__switchCanvas === document.querySelector('.home-demo-panel canvas')",
      ), true);
      assert.deepEqual(await cdp.evaluate(sessionId, "window.__homeErrors"), []);
    } finally {
      await cdp.send("Target.closeTarget", { targetId });
    }
  }
}

async function verifyLanguageButton(cdp, sessionId, locale, path, preservedSelector) {
  const nextLocale = locale === "en" ? "zh-CN" : "en";
  const nextPath = path === "/explore" ? path : nextLocale === "en" ? "/en" : "/";
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 760, deviceScaleFactor: 1, mobile: true,
  }, sessionId);
  const buttonState = await cdp.evaluate(sessionId, `(() => {
    const button = document.querySelector('#language');
    const actions = [...document.querySelectorAll('.shell-topbar-right > .shell-action')];
    const index = actions.indexOf(button);
    const rect = button?.getBoundingClientRect();
    const label = button?.querySelector('.shell-action-label');
    window.__languagePreservedNode = document.querySelector(${JSON.stringify(preservedSelector)});
    return {
      after: actions[index + 1]?.id,
      nextAfter: actions[index + 2]?.id,
      icon: button?.querySelector('[data-icon]')?.getAttribute('data-icon'),
      title: button?.title,
      label: label?.textContent,
      labelVisible: Boolean(label?.getBoundingClientRect().width),
      visible: Boolean(rect?.width && rect?.height && rect.left >= 0 && rect.right <= innerWidth),
    };
  })()`);
  assert.deepEqual(buttonState, {
    after: "music", nextAfter: "settings", icon: "language", visible: true,
    label: locale === "en" ? "中文" : "English", labelVisible: false,
    title: locale === "en" ? "切换到中文" : "Switch to English",
  }, JSON.stringify(await cdp.evaluate(sessionId, `(() => ({
    path: location.pathname,
    width: innerWidth,
    elements: ['.app-topbar', '.shell-topbar-left', '.shell-topbar-right', '.shell-identity', '#language']
      .map((selector) => {
        const element = document.querySelector(selector);
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { selector, left: rect.left, right: rect.right, width: rect.width, flex: style.flex };
      }),
  }))()`)));
  await cdp.evaluate(sessionId, "document.querySelector('#language').click()");
  await waitForBrowserState(async () => await cdp.evaluate(sessionId, `
    document.documentElement.lang === ${JSON.stringify(nextLocale)} &&
    location.pathname === ${JSON.stringify(nextPath)} &&
    JSON.parse(localStorage.getItem('bc5r:setting')).locale === ${JSON.stringify(nextLocale)}
  `));
  assert.equal(await cdp.evaluate(sessionId,
    `window.__languagePreservedNode === document.querySelector(${JSON.stringify(preservedSelector)})`,
  ), true);
  assert.equal(await cdp.evaluate(sessionId,
    "Boolean(document.querySelector('.quick-settings-panel'))",
  ), false);

  await cdp.send("Emulation.clearDeviceMetricsOverride", {}, sessionId);
  assert.equal(await cdp.evaluate(sessionId,
    "document.querySelector('#language .shell-action-label').getBoundingClientRect().width > 0",
  ), true);
  await cdp.evaluate(sessionId, "document.querySelector('#settings').click()");
  await waitForBrowserState(async () => await cdp.evaluate(sessionId,
    "Boolean(document.querySelector('.quick-settings-panel'))",
  ));
  const nextLabel = nextLocale === "en" ? "English" : "中文";
  assert.equal(await cdp.evaluate(sessionId, `
    [...document.querySelectorAll('.quick-settings-panel button[role=radio]')]
      .find((button) => button.textContent.trim() === ${JSON.stringify(nextLabel)})
      ?.getAttribute('aria-checked')
  `), "true");

  const originalLabel = locale === "en" ? "English" : "中文";
  await cdp.evaluate(sessionId, `
    [...document.querySelectorAll('.quick-settings-panel button[role=radio]')]
      .find((button) => button.textContent.trim() === ${JSON.stringify(originalLabel)}).click()
  `);
  await waitForBrowserState(async () => await cdp.evaluate(sessionId, `
    document.documentElement.lang === ${JSON.stringify(locale)} &&
    location.pathname === ${JSON.stringify(path)} &&
    JSON.parse(localStorage.getItem('bc5r:setting')).locale === ${JSON.stringify(locale)}
  `));
  assert.equal(await cdp.evaluate(sessionId,
    "document.querySelector('#language').getAttribute('aria-label')",
  ), locale === "en" ? "切换到中文" : "Switch to English");
  await cdp.evaluate(sessionId, `(() => {
    const layer = document.querySelector('[data-quick-settings-layer]');
    layer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    layer.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    layer.click();
  })()`);
  await waitForBrowserState(async () => await cdp.evaluate(sessionId,
    "!document.querySelector('.quick-settings-panel')",
  ));
}
