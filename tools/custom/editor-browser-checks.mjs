import { waitForBrowserState } from "./browser-regression-wait.mjs";
import { verifyEditorCanvasPerformance } from "./editor-performance-browser.mjs";
import { replayLayout } from "./replay-browser-checks.mjs";

export async function verifyEditorExperience(cdp, sessionId) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('.editor-canvas') && document.querySelector('[data-palette-type=\"egg\"]')",
        ),
      ),
    20_000,
  );
  await verifyLayerReordering(cdp, sessionId);
  await verifySurfaceInspector(cdp, sessionId);
  await verifyPaletteTooltip(cdp, sessionId);
  await verifyEditorCanvasPerformance(cdp, sessionId);
  await verifyPlayControls(cdp, sessionId);
}

async function verifyLayerReordering(cdp, sessionId) {
  await clickWhenPresent(cdp, sessionId, "#editor-tool-select");
  const cell = await cdp.evaluate(
    sessionId,
    `(() => {
      const canvas = document.querySelector('.editor-canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + rect.width * 2.5 / 16,
        y: rect.top + rect.height * 2.5 / 16,
      };
    })()`,
  );
  if (!cell) throw new Error("Editor Bobby cell was not measurable");
  await clickPoint(cdp, sessionId, cell);
  await waitForBrowserState(async () =>
    (await editorLayerOrder(cdp, sessionId)).length >= 2,
  );
  const initial = await editorLayerOrder(cdp, sessionId);
  const mouseDrag = await editorLayerDragPoints(cdp, sessionId);
  if (!mouseDrag) throw new Error("Editor layer drag controls were not measurable");
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      x: mouseDrag.from.x,
      y: mouseDrag.from.y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseMoved",
      x: mouseDrag.to.x,
      y: mouseDrag.to.y,
      button: "left",
      buttons: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      x: mouseDrag.to.x,
      y: mouseDrag.to.y,
      button: "left",
      buttons: 0,
      clickCount: 1,
    },
    sessionId,
  );
  await waitForLayerOrderChange(cdp, sessionId, initial, "鼠标");
  await clickWhenPresent(cdp, sessionId, "#editor-undo");
  await waitForLayerOrder(cdp, sessionId, initial);

  const touchDrag = await editorLayerDragPoints(cdp, sessionId);
  if (!touchDrag) throw new Error("Editor touch layer controls were not measurable");
  await cdp.send(
    "Input.dispatchTouchEvent",
    {
      type: "touchStart",
      touchPoints: [{ x: touchDrag.from.x, y: touchDrag.from.y }],
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchTouchEvent",
    {
      type: "touchMove",
      touchPoints: [{ x: touchDrag.to.x, y: touchDrag.to.y }],
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchTouchEvent",
    { type: "touchEnd", touchPoints: [] },
    sessionId,
  );
  await waitForLayerOrderChange(cdp, sessionId, initial, "触摸");
  await clickWhenPresent(cdp, sessionId, "#editor-undo");
  await waitForLayerOrder(cdp, sessionId, initial);
}

async function editorLayerOrder(cdp, sessionId) {
  return cdp.evaluate(
    sessionId,
    `[...document.querySelectorAll('[data-editor-layer-ref]')]
      .map((card) => card.getAttribute('data-editor-layer-ref'))`,
  );
}

async function editorLayerDragPoints(cdp, sessionId) {
  return cdp.evaluate(
    sessionId,
    `(() => {
      const cards = [...document.querySelectorAll('[data-editor-layer-ref]')];
      const handle = cards[0]?.querySelector('.editor-layer-drag');
      const target = cards.at(-1);
      if (!handle || !target || cards.length < 2) return null;
      const from = handle.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      return {
        from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
        to: { x: to.left + to.width / 2, y: to.top + to.height * 0.75 },
      };
    })()`,
  );
}

async function waitForLayerOrderChange(cdp, sessionId, initial, pointerLabel) {
  await waitForBrowserState(async () => {
    const current = await editorLayerOrder(cdp, sessionId);
    return JSON.stringify(current) !== JSON.stringify(initial);
  }).catch((cause) => {
    throw new Error(`Editor ${pointerLabel}拖动没有调整 Entity 顺序`, { cause });
  });
}

async function waitForLayerOrder(cdp, sessionId, expected) {
  await waitForBrowserState(async () =>
    JSON.stringify(await editorLayerOrder(cdp, sessionId)) ===
      JSON.stringify(expected),
  );
}

async function clickPoint(cdp, sessionId, point) {
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
}

async function verifySurfaceInspector(cdp, sessionId) {
  await cdp.evaluate(
    sessionId,
    "document.querySelector('#editor-surface')?.click(); true",
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-surface-panel')",
      ),
    ),
  );
  const point = await cdp.evaluate(
    sessionId,
    `(() => {
      const canvas = document.querySelector('.editor-canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 32,
        y: rect.top + rect.height / 32,
      };
    })()`,
  );
  if (!point) throw new Error("Editor canvas was not measurable");
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await waitForBrowserState(async () =>
    Number(
      await cdp.evaluate(
        sessionId,
        "document.querySelectorAll('.editor-layer-card .editor-surface-variant-btn').length",
      ),
    ) > 1,
  );
  const snapshot = await cdp.evaluate(
    sessionId,
    `(() => {
      const card = document.querySelector('.editor-layer-card');
      const active = card?.querySelector('.editor-surface-variant-btn.active');
      const next = [...(card?.querySelectorAll('.editor-surface-variant-btn') ?? [])]
        .find((button) => button !== active);
      const nextTitle = next?.getAttribute('title') ?? '';
      next?.click();
      return {
        selects: card?.querySelectorAll('select').length ?? -1,
        nextTitle,
        text: document.body.textContent ?? '',
      };
    })()`,
  );
  if (snapshot.selects !== 0 || !snapshot.nextTitle) {
    throw new Error("Surface Inspector did not expose a visual-only variant grid");
  }
  if (snapshot.text.includes("使用未注册 type")) {
    throw new Error("Editor reported an unregistered canonical Entity type");
  }
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.editor-layer-card .editor-surface-variant-btn.active')?.getAttribute('title') ?? ''",
    )) === snapshot.nextTitle,
  );
}

async function verifyPaletteTooltip(cdp, sessionId) {
  await cdp.evaluate(
    sessionId,
    "document.querySelector('#editor-palette')?.click(); true",
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-palette-type=\"egg\"]')",
      ),
    ),
  );
  const point = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = document.querySelector('[data-palette-type="egg"]');
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  if (!point) throw new Error("Egg Palette item was not measurable");
  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mouseMoved", x: point.x, y: point.y },
    sessionId,
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-material-tooltip')",
      ),
    ),
  );
  const tooltip = await cdp.evaluate(
    sessionId,
    `(() => {
      const element = document.querySelector('.editor-material-tooltip');
      return {
        name: element?.querySelector('strong')?.textContent ?? '',
        type: element?.querySelector('code')?.textContent ?? '',
      };
    })()`,
  );
  if (tooltip.name !== "Egg" || tooltip.type !== "egg") {
    throw new Error(`Egg Palette tooltip was incorrect: ${JSON.stringify(tooltip)}`);
  }
}

async function verifyPlayControls(cdp, sessionId) {
  await clickWhenPresent(cdp, sessionId, "#editor-play");
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          `(() => {
            const replay = document.querySelector('#editor-replay-record');
            return replay && !replay.disabled &&
              document.querySelector('#screen-control') &&
              document.querySelector('[data-replay-panel]') &&
              !document.querySelector('#editor-palette') &&
              !document.querySelector('#editor-inspector');
          })()`,
        ),
      ),
    20_000,
  );
  await clickWhenPresent(cdp, sessionId, "#editor-replay-record");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "!document.querySelector('[data-replay-panel]')?.hidden",
      ),
    ),
  );
  const layout = await replayLayout(cdp, sessionId);
  if (layout.canvasLeft < layout.panelRight - 1) {
    throw new Error("Editor Replay panel did not reserve canvas space");
  }
  const builtinReplayVisible = await cdp.evaluate(
    sessionId,
    "Boolean(document.querySelector('[data-replay-action=\"load-builtin\"]'))",
  );
  if (builtinReplayVisible) {
    throw new Error("Editor Replay panel exposed an unrelated builtin replay action");
  }
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-replay-status]')?.textContent ?? ''",
    )) === "正在录制",
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );

  const joystickWasHidden = await cdp.evaluate(
    sessionId,
    "Boolean(document.querySelector('.engine-screen-joystick-layer')?.hidden)",
  );
  await clickWhenPresent(cdp, sessionId, "#screen-control");
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "Boolean(document.querySelector('.engine-screen-joystick-layer')?.hidden)",
    )) !== joystickWasHidden,
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
