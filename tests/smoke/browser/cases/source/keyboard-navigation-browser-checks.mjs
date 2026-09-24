import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyGameKeyboard(cdp, sessionId) {
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.activeElement?.matches('.home-mode-card')"));
  await cdp.evaluate(sessionId, `(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      const failure = url.includes('/assets/maps/original/1-4.json');
      if (failure || url.includes('/assets/maps/original/1-2.json')) {
        return Promise.resolve(new Response(JSON.stringify({
          schemaVersion: 1,
          meta: { name: '键盘结算回归' },
          rules: failure ? { limits: [{ type: "max-time-seconds", seconds: 1 }] } : { win: { type: "carrot" } },
          width: 3,
          height: 1,
          entities: [
            { type: 'grass', variant: 'ts-10-1', x: 0, y: 0 },
            { type: 'grass', variant: 'ts-10-1', x: 1, y: 0 },
            { type: 'grass', variant: 'ts-10-1', x: 2, y: 0 },
            { type: 'bobby', x: 0, y: 0 },
            { type: 'carrot', x: 2, y: 0 },
          ],
        }), { headers: { 'content-type': 'application/json' } }));
      }
      return originalFetch(input, init);
    };
    history.pushState(null, '', '/explore/play/original/1-2');
    window.dispatchEvent(new PopStateEvent('popstate'));
  })()`);
  await readyGame(cdp, sessionId, "1-2");
  await key(cdp, sessionId, "]", "BracketRight", 221);
  await readyGame(cdp, sessionId, "1-3");
  const joystickBefore = await cdp.evaluate(sessionId,
    "document.querySelector('#screen-control')?.getAttribute('aria-pressed')");
  await key(cdp, sessionId, "x", "KeyX", 88);
  if (joystickBefore === await cdp.evaluate(sessionId,
    "document.querySelector('#screen-control')?.getAttribute('aria-pressed')"))
    throw new Error("Play X 未切换屏幕摇杆");
  await key(cdp, sessionId, "x", "KeyX", 88);
  await key(cdp, sessionId, "[", "BracketLeft", 219);
  await readyGame(cdp, sessionId, "1-2");
  for (let attempt = 0; attempt < 8; attempt++) {
    await key(cdp, sessionId, "ArrowRight", "ArrowRight", 39);
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (await cdp.evaluate(sessionId, "Number(document.querySelector('.engine-gameplay-hud-steps')?.textContent) > 0")) break;
  }
  if (!await cdp.evaluate(sessionId, "Number(document.querySelector('.engine-gameplay-hud-steps')?.textContent) > 0"))
    throw new Error("重开测试未产生移动步数");
  await key(cdp, sessionId, "R", "KeyR", 82, 8);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "Number(document.querySelector('.engine-gameplay-hud-steps')?.textContent) === 0"));
  let won = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    await key(cdp, sessionId, "ArrowRight", "ArrowRight", 39);
    await new Promise((resolve) => setTimeout(resolve, 250));
    won = await cdp.evaluate(sessionId,
      "Boolean(document.querySelector('[data-result-overlay]:not([hidden]) [data-result=next]:enabled'))");
    if (won) break;
  }
  if (!won) {
    const state = await cdp.evaluate(sessionId, `({
      path: location.pathname,
      focus: document.activeElement?.outerHTML,
      result: document.querySelector('[data-result-overlay]')?.outerHTML,
      text: document.querySelector('.app-content')?.textContent,
    })`);
    throw new Error(`键盘移动未完成最小胡萝卜关卡：${JSON.stringify(state)}`);
  }
  const focused = await cdp.evaluate(sessionId,
    "document.activeElement?.getAttribute('data-result')");
  if (focused !== "next") throw new Error(`结算默认焦点异常：${focused}`);
  await cdp.evaluate(sessionId, "document.documentElement.dataset.keyboardFocus = 'false'; true");
  if (await cdp.evaluate(sessionId, "getComputedStyle(document.activeElement).outlineStyle") === "none")
    throw new Error("结算默认主要按钮未显示焦点边框");
  await key(cdp, sessionId, "ArrowLeft", "ArrowLeft", 37);
  if (await cdp.evaluate(sessionId, "document.activeElement?.dataset.result") !== "levels")
    throw new Error("结算左键未选择返回按钮");
  await key(cdp, sessionId, "ArrowRight", "ArrowRight", 39);
  await key(cdp, sessionId, "Enter", "Enter", 13);
  await readyGame(cdp, sessionId, "1-3");
  await key(cdp, sessionId, "Escape", "Escape", 27);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "location.pathname === '/explore' && document.activeElement?.matches('.explore-map-card')"));
  await cdp.evaluate(sessionId, `(() => {
    history.pushState(null, '', '/explore/play/original/1-4');
    window.dispatchEvent(new PopStateEvent('popstate'));
  })()`);
  await readyGame(cdp, sessionId, "1-4");
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.activeElement?.dataset.result === 'retry'"));
  await key(cdp, sessionId, "ArrowLeft", "ArrowLeft", 37);
  await key(cdp, sessionId, "Enter", "Enter", 13);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "location.pathname === '/explore' && document.activeElement?.matches('.explore-map-card')"));
}

export async function verifyExploreKeyboard(cdp, sessionId) {
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.activeElement?.matches('.explore-map-card')"));
  const state = await cdp.evaluate(sessionId, `({
    paths: [...document.querySelectorAll('.explore-tabs a')].map(a => new URL(a.href).pathname),
    first: document.activeElement?.getAttribute('href'),
    music: document.querySelector('#music')?.title,
    random: document.querySelector('#random-level')?.title,
    resume: document.querySelector('#continue-level')?.title,
  })`);
  if (!state.music?.includes('(M)') || !state.random?.includes('(Shift+S)') || !state.resume?.includes('(P)'))
    throw new Error(`快捷键 tooltip 缺失：${JSON.stringify(state)}`);
  await key(cdp, sessionId, 'ArrowRight', 'ArrowRight', 39);
  const selected = await cdp.evaluate(sessionId, "document.activeElement?.getAttribute('href')");
  if (!selected || selected === state.first) throw new Error('Explore 方向键未切换关卡');
  await cdp.evaluate(sessionId, "document.activeElement.blur(); true");
  await key(cdp, sessionId, 'ArrowDown', 'ArrowDown', 40);
  if (selected !== await cdp.evaluate(sessionId, "document.activeElement?.getAttribute('href')"))
    throw new Error('Explore 失去焦点后方向键未恢复上次关卡选择');
  await holdDirection(cdp, sessionId, "ArrowDown", 40);
  if (selected === await cdp.evaluate(sessionId, "document.activeElement?.getAttribute('href')"))
    throw new Error("Explore 长按方向键未继续选择关卡");
  await key(cdp, sessionId, 'Tab', 'Tab', 9);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    `location.pathname === ${JSON.stringify(state.paths[1])} && document.activeElement?.matches('.explore-map-card')`));
  await key(cdp, sessionId, 'Tab', 'Tab', 9, 8);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    `location.pathname === ${JSON.stringify(state.paths[0])} && document.activeElement?.matches('.explore-map-card')`));
  await key(cdp, sessionId, 'p', 'KeyP', 80);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "location.pathname.includes('/explore/play/') && document.activeElement?.id === 'game'"));
  await key(cdp, sessionId, 'Escape', 'Escape', 27);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "location.pathname === '/explore' && document.activeElement?.matches('.explore-map-card')"));
  await key(cdp, sessionId, 'S', 'KeyS', 83, 8);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "location.pathname.includes('/explore/play/') && document.activeElement?.id === 'game'"));
}

export async function verifyEditorKeyboard(cdp, sessionId) {
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.activeElement?.matches('canvas.editor-canvas')"));
  for (const modifiers of [0, 8, 0]) {
    await key(cdp, sessionId, "Tab", "Tab", 9, modifiers);
    const focused = await cdp.evaluate(sessionId,
      "document.activeElement?.matches('canvas.editor-canvas') && document.activeElement.tabIndex === -1");
    if (!focused) throw new Error("Editor Tab 进入了控件焦点轮换");
  }
  await key(cdp, sessionId, "z", "KeyZ", 90);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "Boolean(document.querySelector('.editor-surface-panel'))"));
  await key(cdp, sessionId, "z", "KeyZ", 90);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "Boolean(document.querySelector('.editor-palette:not(.editor-surface-panel)'))"));
  await key(cdp, sessionId, "x", "KeyX", 88);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.querySelector('.editor-level-info')?.getClientRects().length > 0"));
  await key(cdp, sessionId, "x", "KeyX", 88);
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    "document.querySelector('.editor-inspector:not(.editor-level-info)')?.getClientRects().length > 0 && document.querySelector('.editor-level-info')?.getClientRects().length === 0"));
}

async function readyGame(cdp, sessionId, id) {
  await waitForBrowserState(async () => cdp.evaluate(sessionId,
    `(() => {
      const canvas = document.querySelector('#game');
      if (!location.pathname.endsWith('/${id}') || document.activeElement !== canvas ||
          !canvas || canvas === window.__keyboardLastCanvas) return false;
      window.__keyboardLastCanvas = canvas;
      return true;
    })()`));
}

async function key(cdp, sessionId, key, code, windowsVirtualKeyCode, modifiers = 0) {
  const options = { key, code, windowsVirtualKeyCode, modifiers };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...options, ...(key === "Enter" ? { text: "\r" } : {}) }, sessionId);
  if (key.startsWith("Arrow")) await new Promise((resolve) => setTimeout(resolve, 100));
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...options }, sessionId);
}

export async function holdDirection(cdp, sessionId, key, windowsVirtualKeyCode) {
  const options = { key, code: key, windowsVirtualKeyCode };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...options }, sessionId);
  for (let index = 0; index < 2; index++) {
    await new Promise((resolve) => setTimeout(resolve, 130));
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...options, autoRepeat: true }, sessionId);
  }
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...options }, sessionId);
}
