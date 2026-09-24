import { waitForBrowserState } from "./browser-regression-wait.mjs";

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
