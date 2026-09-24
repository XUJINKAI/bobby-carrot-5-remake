import { holdDirection } from "./keyboard-navigation-browser-checks.mjs";
import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyButtonFocusPolicy(cdp, sessionId) {
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.activeElement?.matches('.home-mode-card')"));
  const initialOutline = await cdp.evaluate(sessionId,
    "getComputedStyle(document.activeElement).outlineStyle");
  if (initialOutline !== "none") throw new Error("页面初次加载显示了焦点框");
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.querySelector('.home-demo-panel .engine-screen-joystick-layer')?.hidden === false"));
  await cdp.evaluate(sessionId, "document.querySelector('.home-demo-screen-control').click(); true");
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.querySelector('.home-demo-panel .engine-screen-joystick-layer')?.hidden === true && document.querySelector('.home-demo-screen-control')?.getAttribute('aria-pressed') === 'false'"));
  await cdp.evaluate(sessionId, "document.querySelector('.home-demo-screen-control').click(); true");
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.querySelector('.home-demo-panel .engine-screen-joystick-layer')?.hidden === false && document.querySelector('.home-demo-screen-control')?.getAttribute('aria-pressed') === 'true'"));
  const initial = await cdp.evaluate(sessionId, `(() => {
    document.querySelector('#music').focus();
    return {
      musicFocused: document.activeElement?.id === 'music',
      musicTabIndex: document.querySelector('#music').tabIndex,
      modeStops: [...document.querySelectorAll('.home-mode-card')].filter((item) => item.tabIndex === 0).length,
      settingsTabIndex: document.querySelector('#settings').tabIndex,
    };
  })()`);
  if (initial.musicFocused || initial.musicTabIndex !== -1 || initial.modeStops !== 1 || initial.settingsTabIndex !== -1)
    throw new Error(`声明式焦点配置异常：${JSON.stringify(initial)}`);
  await cdp.evaluate(sessionId, "document.querySelector('.home-mode-card').focus(); true");
  await holdDirection(cdp, sessionId, "ArrowDown", 40);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('[data-home-import]')")))
    throw new Error("首页长按方向键未连续选择模式");
  await cdp.evaluate(sessionId, "document.querySelector('.home-mode-card').focus(); true");
  await press(cdp, sessionId, "Tab", 9);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('.home-demo-panel canvas')")))
    throw new Error("首页 Tab 未从模式组进入试玩画布");
  const demoOutline = await cdp.evaluate(sessionId,
    "getComputedStyle(document.querySelector('.home-demo-panel')).outlineStyle");
  if (demoOutline === "none") throw new Error("Demo 焦点未标记整个面板");
  await press(cdp, sessionId, "ArrowDown", 40);
  if (await cdp.evaluate(sessionId,
    "getComputedStyle(document.querySelector('.home-demo-panel')).outlineStyle") === "none")
    throw new Error("Tab 进入 Demo 后方向键游玩丢失了焦点框");
  const demoPoint = await cdp.evaluate(sessionId, `(() => {
    const rect = document.querySelector('.home-demo-panel canvas').getBoundingClientRect();
    return { x: rect.left + rect.width / 4, y: rect.top + rect.height / 4 };
  })()`);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed", button: "left", clickCount: 1, ...demoPoint,
  }, sessionId);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased", button: "left", clickCount: 1, ...demoPoint,
  }, sessionId);
  await holdDirection(cdp, sessionId, "ArrowDown", 40);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('.home-demo-panel canvas')")))
    throw new Error("鼠标进入 Demo 后方向键游玩丢失了画布焦点");
  if (await cdp.evaluate(sessionId,
    "getComputedStyle(document.querySelector('.home-demo-panel')).outlineStyle") !== "none")
    throw new Error("鼠标进入 Demo 后方向键游玩显示了焦点框");
  await press(cdp, sessionId, "Tab", 9, { modifiers: 8 });
  await press(cdp, sessionId, "Tab", 9, { modifiers: 8 });
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('.home-demo-panel canvas')")) ||
    await cdp.evaluate(sessionId,
      "getComputedStyle(document.querySelector('.home-demo-panel')).outlineStyle") === "none")
    throw new Error("Shift+Tab 重新进入 Demo 未显示面板焦点框");
  await cdp.evaluate(sessionId, "document.activeElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })); document.activeElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' })); true");
  await press(cdp, sessionId, "ArrowDown", 40);
  if (await cdp.evaluate(sessionId,
    "getComputedStyle(document.querySelector('.home-demo-panel')).outlineStyle") !== "none")
    throw new Error("触屏操作后 Demo 焦点框仍然显示");
  await press(cdp, sessionId, "Tab", 9);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('.home-mode-card')")))
    throw new Error("首页 Tab 没有在模式菜单和 Demo 之间循环");
  await press(cdp, sessionId, "ArrowUp", 38);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('.home-embed-link')")))
    throw new Error("内嵌链接未加入模式菜单方向键选择");
  await press(cdp, sessionId, "ArrowUp", 38);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('[data-home-import]')")))
    throw new Error("首页方向键未选中导入按钮");
  await cdp.evaluate(sessionId, "document.activeElement.blur(); true");
  await press(cdp, sessionId, "ArrowDown", 40);
  if (!(await cdp.evaluate(sessionId, "document.activeElement?.matches('[data-home-import]')")))
    throw new Error("首页失去焦点后方向键未恢复上次模式选择");
  await press(cdp, sessionId, "Enter", 13);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.querySelector('.home-import-dialog-layer')?.contains(document.activeElement)"));
  await cdp.evaluate(sessionId, "document.querySelector('.home-import-dialog textarea').focus(); true");
  const music = await cdp.evaluate(sessionId, "document.querySelector('#music').getAttribute('aria-pressed')");
  await press(cdp, sessionId, "m", 77);
  if (music !== await cdp.evaluate(sessionId, "document.querySelector('#music').getAttribute('aria-pressed')"))
    throw new Error("文本框输入触发了全局音乐快捷键");
  for (let index = 0; index < 12; index++) {
    await press(cdp, sessionId, "Tab", 9);
    if (!(await cdp.evaluate(sessionId,
      "document.querySelector('.home-import-dialog-layer')?.contains(document.activeElement)")))
      throw new Error("Tab 焦点离开了当前弹窗");
  }
  await press(cdp, sessionId, "Escape", 27);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "!document.querySelector('.home-import-dialog-layer') && document.activeElement?.matches('[data-home-import]')"));
  await cdp.evaluate(sessionId, `(() => {
    const button = document.createElement('button');
    button.id = 'unregistered-focus-probe';
    document.querySelector('.home-page').append(button);
    button.focus();
  })()`);
  await press(cdp, sessionId, "Tab", 9);
  const dynamic = await cdp.evaluate(sessionId, `({
    tabIndex: document.querySelector('#unregistered-focus-probe').tabIndex,
    focused: document.activeElement?.id === 'unregistered-focus-probe',
  })`);
  if (dynamic.tabIndex !== -1 || dynamic.focused)
    throw new Error("未登记的动态按钮进入了键盘焦点顺序");
  await press(cdp, sessionId, "?", 191, { code: "Slash", modifiers: 8 });
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "Boolean(document.querySelector('[data-dialog-layer]'))"));
  await press(cdp, sessionId, "Escape", 27);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "!document.querySelector('[data-dialog-layer]')"));
  await verifyTouchBackdropDoesNotClickThrough(cdp, sessionId);
}

async function press(cdp, sessionId, key, windowsVirtualKeyCode, extra = {}) {
  const options = { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, windowsVirtualKeyCode, ...extra };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...options, ...(key === "Enter" ? { text: "\r" } : {}) }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...options }, sessionId);
}

async function verifyTouchBackdropDoesNotClickThrough(cdp, sessionId) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 760, deviceScaleFactor: 1, mobile: true },
    sessionId,
  );
  await cdp.evaluate(
    sessionId,
    "window.__backdropReloadProbe = true; true",
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `window.__backdropReloadProbe !== true &&
          document.querySelector('.home-page') &&
          document.querySelector('#settings') &&
          document.querySelector('#music')`,
      ),
    ),
  );
  const point = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = document.querySelector('#music');
      window.__backdropLeakClicks = 0;
      button.addEventListener('click', () => window.__backdropLeakClicks++);
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('#settings').click(); true",
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-quick-settings-layer]')",
      ),
    ),
  );
  await cdp.evaluate(sessionId, "window.__backdropLeakClicks = 0; true");
  await cdp.send(
    "Input.dispatchTouchEvent",
    {
      type: "touchStart",
      touchPoints: [{ x: point.x, y: point.y }],
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchTouchEvent",
    { type: "touchEnd", touchPoints: [] },
    sessionId,
  );
  await waitForBrowserState(async () =>
    !(await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-quick-settings-layer]')",
    )),
  );
  await new Promise((resolve) => setTimeout(resolve, 150));
  const result = await cdp.evaluate(
    sessionId,
    `({
      clicks: window.__backdropLeakClicks,
      layerOpen: Boolean(document.querySelector('[data-quick-settings-layer]')),
    })`,
  );
  if (result.clicks !== 0 || result.layerOpen) {
    throw new Error(`触屏关闭遮罩时点击了后方按钮：${JSON.stringify(result)}`);
  }
}
