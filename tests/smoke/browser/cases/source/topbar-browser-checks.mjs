import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyAdventureHomeLanguageButton(cdp, sessionId) {
  const contentSelector = ".adventure-menu";
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 760, deviceScaleFactor: 1, mobile: true },
    sessionId,
  );
  await waitForBrowserState(async () =>
    Boolean(await cdp.evaluate(sessionId, `
      document.querySelector('#language') &&
      document.querySelector('#music') &&
      document.querySelector(${JSON.stringify(contentSelector)})
    `)),
    20_000,
  );

  const initial = await cdp.evaluate(sessionId, `(() => {
    const language = document.querySelector('#language');
    const music = document.querySelector('#music');
    const actions = [...document.querySelectorAll('.shell-topbar-right > .shell-action')];
    const rect = language.getBoundingClientRect();
    window.__adventureLanguageContent = document.querySelector(${JSON.stringify(contentSelector)});
    return {
      path: location.pathname,
      locale: document.documentElement.lang,
      beforeMusic: actions.indexOf(language) + 1 === actions.indexOf(music),
      visible: rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.right <= innerWidth,
    };
  })()`);
  if (!initial.beforeMusic || !initial.visible) {
    throw new Error(`Adventure 语言按钮位置或可见性错误：${JSON.stringify(initial)}`);
  }

  await cdp.evaluate(sessionId, "document.querySelector('#language').click()");
  await waitForBrowserState(async () =>
    (await cdp.evaluate(sessionId, "document.documentElement.lang")) !== initial.locale,
  );
  const updated = await cdp.evaluate(sessionId, `({
    path: location.pathname,
    preserved: window.__adventureLanguageContent === document.querySelector(${JSON.stringify(contentSelector)}),
  })`);
  if (updated.path !== initial.path || !updated.preserved) {
    throw new Error(`Adventure 切换语言后页面状态错误：${JSON.stringify(updated)}`);
  }

  await cdp.evaluate(sessionId, "document.querySelector('#language').click()");
  await waitForBrowserState(async () =>
    (await cdp.evaluate(sessionId, "document.documentElement.lang")) === initial.locale,
  );
}

export async function verifyNarrowHomeProductName(cdp, sessionId) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 760, deviceScaleFactor: 1, mobile: true },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.shell-product-name')",
      ),
    ),
  );

  const result = await cdp.evaluate(
    sessionId,
    `(() => {
      const name = document.querySelector('.shell-product-name');
      const rect = name?.getBoundingClientRect();
      return {
        text: name?.textContent?.trim() ?? '',
        display: name ? getComputedStyle(name).display : 'missing',
        width: rect?.width ?? 0,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    })()`,
  );

  if (
    !["兔子波比5重制版", "Bobby Carrot 5 Remake"].includes(result.text) ||
    result.display === "none" ||
    result.width <= 0 ||
    result.viewportWidth !== 390 ||
    result.documentWidth > result.viewportWidth
  ) {
    throw new Error(`首页窄屏应用名不可见或页面溢出：${JSON.stringify(result)}`);
  }
}
