import assert from "node:assert/strict";

/** 真实指针事件验证视口操作的绘制成本，覆盖 Vue 与 EditorInput 的整条链路。 */
export async function verifyEditorCanvasPerformance(cdp, sessionId) {
  const point = await cdp.evaluate(sessionId, `(() => {
    const canvas = document.querySelector('.editor-canvas');
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    const drawImage = context.drawImage.bind(context);
    window.editorDrawCount = 0;
    context.drawImage = (...args) => {
      window.editorDrawCount += 1;
      return drawImage(...args);
    };
    return { x: rect.left + 30, y: rect.top + 30 };
  })()`);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    ...point,
  }, sessionId);
  await settle(cdp, sessionId);
  const before = await cdp.evaluate(sessionId, `(() => {
    window.editorDrawCount = 0;
    return document.querySelector('.editor-canvas-stage').style.transform;
  })()`);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    ...point,
    button: "middle",
    buttons: 4,
    clickCount: 1,
  }, sessionId);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: point.x + 24,
    y: point.y + 16,
    button: "middle",
    buttons: 4,
  }, sessionId);
  await settle(cdp, sessionId);
  const after = await cdp.evaluate(sessionId, `(() => ({
    transform: document.querySelector('.editor-canvas-stage').style.transform,
    draws: window.editorDrawCount,
  }))()`);
  assert.notEqual(after.transform, before, "中键平移应更新视口变换");
  assert.equal(after.draws, 0, "中键平移应复用已有地图画布");
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x + 24,
    y: point.y + 16,
    button: "middle",
    clickCount: 1,
  }, sessionId);
}

async function settle(cdp, sessionId) {
  await cdp.send("Runtime.evaluate", {
    expression: "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    awaitPromise: true,
  }, sessionId);
}
