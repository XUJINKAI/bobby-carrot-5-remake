import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyReplayPanelShortcut(cdp, sessionId) {
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-output]')?.focus(); true",
  );
  await dispatchTab(cdp, sessionId);
  if (await replayPanelHidden(cdp, sessionId))
    throw new Error("Replay Tab shortcut replaced textarea focus navigation");

  await cdp.evaluate(sessionId, "document.activeElement?.blur(); true");
  await dispatchTab(cdp, sessionId);
  await waitForPanelState(cdp, sessionId, true);
  await dispatchTab(cdp, sessionId);
  await waitForPanelState(cdp, sessionId, false);
}

export function replayLayout(cdp, sessionId) {
  return cdp.evaluate(
    sessionId,
    `(() => {
      const stage = document.querySelector('[data-game-stage]').getBoundingClientRect();
      const panel = document.querySelector('[data-replay-panel]').getBoundingClientRect();
      const canvas = document.querySelector('.game-canvas-layer, .editor-game-canvas-layer').getBoundingClientRect();
      return {
        stageLeft: stage.left,
        panelLeft: panel.left,
        panelRight: panel.right,
        canvasLeft: canvas.left,
      };
    })()`,
  );
}

export async function verifyNarrowGameActions(cdp, sessionId) {
  const layout = await cdp.evaluate(
    sessionId,
    `(() => {
      const inspect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          display: getComputedStyle(element).display,
          left: rect.left,
          top: rect.top,
        };
      };
      const joystickLabel = document.querySelector(
        '#screen-control .shell-action-label',
      );
      return {
        topUndo: inspect('#undo'),
        undo: inspect('#narrow-undo'),
        redo: inspect('#narrow-redo'),
        joystick: inspect('#screen-control'),
        joystickLabelDisplay: joystickLabel
          ? getComputedStyle(joystickLabel).display
          : null,
      };
    })()`,
  );
  if (
    layout.topUndo?.display !== "none" ||
    layout.undo?.display === "none" ||
    layout.redo?.display === "none" ||
    layout.joystick?.display === "none"
  ) {
    throw new Error(
      `Narrow gameplay actions were not relocated: ${JSON.stringify(layout)}`,
    );
  }
  if (
    !(layout.undo.left < layout.redo.left &&
      layout.redo.left < layout.joystick.left) ||
    Math.abs(layout.undo.top - layout.joystick.top) > 1 ||
    layout.joystickLabelDisplay !== "none"
  ) {
    throw new Error(
      `Narrow gameplay actions were not aligned as icons: ${JSON.stringify(layout)}`,
    );
  }
}

async function dispatchTab(cdp, sessionId) {
  const key = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...key }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...key }, sessionId);
}

async function waitForPanelState(cdp, sessionId, hidden) {
  await waitForBrowserState(
    async () => (await replayPanelHidden(cdp, sessionId)) === hidden,
  );
}

async function replayPanelHidden(cdp, sessionId) {
  return Boolean(
    await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-replay-panel]')?.hidden",
    ),
  );
}
