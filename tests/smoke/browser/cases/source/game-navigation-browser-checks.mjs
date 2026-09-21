import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyNarrowExploreGameNavigation(cdp, sessionId) {
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
        "document.querySelector('#previous-level') && document.querySelector('#next-level')",
      ),
    ),
  );

  const result = await cdp.evaluate(
    sessionId,
    `(() => {
      const inspect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return {
          display: style.display,
          visibility: style.visibility,
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          unobscured: hit === element || element.contains(hit),
        };
      };
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        identity: inspect('.shell-topbar-left .shell-identity'),
        back: inspect('#back'),
        previous: inspect('#previous-level'),
        next: inspect('#next-level'),
        restart: inspect('#restart'),
        center: inspect('.shell-topbar-center'),
        right: inspect('.shell-topbar-right'),
      };
    })()`,
  );

  if (
    result.viewportWidth !== 390 ||
    result.documentWidth > result.viewportWidth ||
    !isVisibleInViewport(result.previous, result.viewportWidth) ||
    !isVisibleInViewport(result.next, result.viewportWidth) ||
    !isOrderedWithoutOverlap(result)
  ) {
    throw new Error(
      `Explore 窄屏前后关按钮不可见或被遮挡：${JSON.stringify(result)}`,
    );
  }
}

function isOrderedWithoutOverlap(result) {
  const sequence = [
    result.identity,
    result.back,
    result.previous,
    result.next,
    result.restart,
    result.center,
    result.right,
  ];
  return sequence.every(Boolean) && sequence.every((item, index) =>
    index === 0 || sequence[index - 1].right <= item.left + 1
  );
}

function isVisibleInViewport(button, viewportWidth) {
  return Boolean(
    button &&
    button.display !== "none" &&
    button.visibility !== "hidden" &&
    button.width > 0 &&
    button.height > 0 &&
    button.left >= 0 &&
    button.right <= viewportWidth &&
    button.unobscured,
  );
}
