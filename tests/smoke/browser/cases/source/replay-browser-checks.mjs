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
