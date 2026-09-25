import { clickWhenPresent, waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyLayerReordering(cdp, sessionId) {
  await clickWhenPresent(cdp, sessionId, "#editor-tool-select");
  await waitForBrowserState(async () =>
    Boolean(await cdp.evaluate(sessionId, `(() => {
      const canvas = document.querySelector('.editor-canvas');
      const stage = canvas?.closest('.editor-canvas-stage');
      const rect = canvas?.getBoundingClientRect();
      return canvas?.style.width && canvas?.style.height &&
        stage?.style.transform && rect?.width > 0 && rect?.height > 0;
    })()`)),
    20_000,
  );
  const cell = await cdp.evaluate(
    sessionId,
    `(() => {
      const canvas = document.querySelector('.editor-canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = rect.left + rect.width * 2.5 / 16;
      const y = rect.top + rect.height * 2.5 / 16;
      return {
        x,
        y,
        hitCanvas: document.elementFromPoint(x, y) === canvas,
      };
    })()`,
  );
  if (!cell?.hitCanvas) {
    throw new Error(`Editor Bobby 格点击位置未命中画布：${JSON.stringify(cell)}`);
  }
  await clickPoint(cdp, sessionId, cell);
  try {
    await waitForBrowserState(async () =>
      (await editorLayerOrder(cdp, sessionId)).length >= 2,
    );
  } catch (cause) {
    const state = await cdp.evaluate(sessionId, `(() => ({
      tool: document.querySelector('#editor-tool-select')?.getAttribute('aria-pressed'),
      layers: [...document.querySelectorAll('[data-editor-layer-ref]')]
        .map((layer) => layer.getAttribute('data-editor-layer-ref')),
      hit: document.elementFromPoint(${cell.x}, ${cell.y})?.outerHTML.slice(0, 200),
      canvas: document.querySelector('.editor-canvas')?.getBoundingClientRect().toJSON(),
    }))()`);
    throw new Error(`Editor Bobby 格未显示两层 Entity：${JSON.stringify(state)}`, {
      cause,
    });
  }
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
