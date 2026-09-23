import path from "node:path";
import { gzipSync } from "node:zlib";
import { createServer } from "vite";
import { root } from "../../../../tools/lib/fs.mjs";
import { verifyButtonFocusPolicy } from "./source/button-focus-browser-checks.mjs";
import { waitForBrowserState } from "./source/browser-regression-wait.mjs";
import { verifyEditorExperience } from "./source/editor-browser-checks.mjs";
import {
  verifyNarrowExploreTabs,
  verifyNarrowExploreGameNavigation,
} from "./source/game-navigation-browser-checks.mjs";
import { verifyGameplayDialogKeyboard } from "./source/gameplay-dialog-browser-checks.mjs";
import {
  verifyImportErrorFollowsLocale,
  verifyLocaleSwitchPreservesGameSession,
} from "./source/locale-browser-checks.mjs";
import {
  replayLayout,
  verifyReplayPanelShortcut,
} from "./source/replay-browser-checks.mjs";
import { verifySettingsPage } from "./source/settings-browser-checks.mjs";

export async function runSourceBrowserRegression(cdp) {
    const vite = await createServer({
      root: path.join(root, "web"),
      configFile: path.join(root, "web/vite.config.ts"),
      logLevel: "silent",
      server: { host: "127.0.0.1", port: 0 },
    });
    await vite.listen();
    const address = vite.httpServer?.address();
    if (!address || typeof address === "string") {
      await vite.close();
      throw new Error("Failed to determine Vite browser-regression port");
    }

    const origin = `http://127.0.0.1:${address.port}`;

    try {
      await verifyButtonFocusPolicy(cdp, await openPage(cdp, `${origin}/`));
      await verifyMusicInteractionTip(cdp, `${origin}/`);
      await verifyQuickSettings(cdp, `${origin}/`);
      await verifySettingsPage(cdp, await openPage(cdp, `${origin}/settings`));
      await verifyEditorExperience(
        cdp,
        await openPage(cdp, `${origin}/edit`),
      );
      await verifyReplayPanel(cdp, `${origin}/import/v1#${replayPayload()}`);
      await verifyLocaleSwitchPreservesGameSession(
        cdp,
        await openPage(cdp, `${origin}/import/v1#${replayPayload()}`),
      );
      await verifyImportErrorFollowsLocale(
        cdp,
        await openPage(cdp, `${origin}/import/v1#%`),
      );
      await verifyNarrowExploreTabs(
        cdp,
        await openPage(cdp, `${origin}/explore/loma-pushbox`),
      );
      await verifyNarrowExploreGameNavigation(
        cdp,
        await openPage(cdp, `${origin}/explore/play/original/1-2`),
      );
      await verifyAdventureDeveloperTools(
        cdp,
        `${origin}/adventure/play/1-1`,
      );
      const dialogSessionId = await verifyGameplayDialog(
        cdp,
        `${origin}/import/v1#${dialogPayload()}`,
      );
      await verifyGameplayDialogKeyboard(
        cdp,
        dialogSessionId,
        `${origin}/@fs${path.join(root, "engine/src/ui/GameplayDialog.ts")}`,
      );
    } finally {
      await vite.close();
    }
}

async function verifyMusicInteractionTip(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('#music .shell-action-tip')",
      ),
    ),
  );

  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mousePressed", x: 4, y: 80, button: "left", clickCount: 1 },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mouseReleased", x: 4, y: 80, button: "left", clickCount: 1 },
    sessionId,
  );
  await waitFor(async () =>
    !Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('#music .shell-action-tip')",
      ),
    ),
  );
}

async function verifyQuickSettings(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await waitFor(async () =>
    Boolean(await cdp.evaluate(sessionId, "document.querySelector('#settings')")),
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('#settings').click(); true",
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-quick-settings-layer]')",
      ),
    ),
  );

  await chooseTheme(cdp, sessionId, "FC", "fc");
  await chooseTheme(cdp, sessionId, "Bobby", "bobby");

  const stored = await cdp.evaluate(
    sessionId,
    `(() => ({
      keys: Object.keys(localStorage).sort(),
      setting: JSON.parse(localStorage.getItem('bc5r:setting'))
    }))()`,
  );
  if (!stored.keys.includes("bc5r:setting"))
    throw new Error("Quick Settings 未写入 bc5r:setting");
  if (
    stored.keys.some(
      (key) => key.startsWith("bobby.") || key === "bc5r:screen-control",
    )
  )
    throw new Error("Quick Settings 写入了散装设置 key");
  if (
    stored.setting?.schemaVersion !== 1 ||
    stored.setting?.theme !== "bobby"
  )
    throw new Error("Quick Settings 写入的 settings document 无效");
}

async function chooseTheme(cdp, sessionId, label, expected) {
  const clicked = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = [...document.querySelectorAll('.quick-settings-panel button[role="radio"]')]
        .find((item) => item.textContent?.trim() === ${JSON.stringify(label)});
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Quick Settings theme option missing: ${label}`);
  await waitFor(async () =>
    (await cdp.evaluate(sessionId, "document.documentElement.dataset.theme")) ===
    expected,
  );
  const usable = await cdp.evaluate(
    sessionId,
    "Boolean(document.querySelector('.app-topbar') && document.querySelector('[data-quick-settings-layer]'))",
  );
  if (!usable)
    throw new Error(`Quick Settings became unusable after switching to ${label}`);
}

async function verifyGameplayDialog(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog') && document.querySelector('#game')",
      ),
    ),
    20_000,
  );

  await new Promise((resolve) => setTimeout(resolve, 1_000));
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog:not([hidden])')",
      ),
    ),
  );
  await waitFor(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.engine-gameplay-dialog-text')?.textContent ?? ''",
    )) === "你的金钥匙可以直接打开这把锁。",
  );

  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38, true);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const repeatedText = await cdp.evaluate(
    sessionId,
    "document.querySelector('.engine-gameplay-dialog-text')?.textContent ?? ''",
  );
  if (repeatedText !== "你的金钥匙可以直接打开这把锁。")
    throw new Error("按键重复改变了当前对白段落");

  await dispatchKey(cdp, sessionId, "keyUp", "ArrowUp", 38);
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38);
  await waitFor(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.engine-gameplay-dialog-text')?.textContent ?? ''",
    )) === "向着海狸的方向按键可以继续交谈。",
  );

  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38, true);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const repeatedSecondText = await cdp.evaluate(
    sessionId,
    "document.querySelector('.engine-gameplay-dialog-text')?.textContent ?? ''",
  );
  if (repeatedSecondText !== "向着海狸的方向按键可以继续交谈。")
    throw new Error("按键重复结束了对白");

  await dispatchKey(cdp, sessionId, "keyUp", "ArrowUp", 38);
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog')?.hidden",
      ),
    ),
  );
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowUp", 38);

  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38);
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowUp", 38);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const reopenedDuringCooldown = await cdp.evaluate(
    sessionId,
    "!document.querySelector('.engine-gameplay-dialog')?.hidden",
  );
  if (reopenedDuringCooldown)
    throw new Error("Gameplay dialogue reopened during the 500ms cooldown");

  await new Promise((resolve) => setTimeout(resolve, 450));
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowUp", 38);
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowUp", 38);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog:not([hidden])')",
      ),
    ),
  );
  await waitFor(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.engine-gameplay-dialog-text')?.textContent ?? ''",
    )) === "你的金钥匙可以直接打开这把锁。",
  );
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowLeft", 37);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog')?.hidden",
      ),
    ),
  );
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowLeft", 37);
  return sessionId;
}

async function verifyAdventureDeveloperTools(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForReplayPanelReady(cdp, sessionId);
  await verifyReplaySaveButton(cdp, sessionId);

  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const load = document.querySelector('[data-replay-action="load-builtin"]');
          const verification = document.querySelector('[data-replay-verification]');
          const text = verification?.textContent ?? '';
          if (
            load &&
            !load.disabled &&
            ['等待录制', 'Waiting for recording'].includes(text)
          ) {
            load.click();
          }
          return ['内置过法已载入', 'Built-in solution loaded'].includes(
            verification?.textContent ?? '',
          );
        })()`,
      ),
    ),
  );

  await clickWhenPresent(cdp, sessionId, "#replay-record");
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "!document.querySelector('[data-replay-panel]')?.hidden",
      ),
    ),
  );
  await verifyReplayPanelShortcut(cdp, sessionId);
  await cdp.evaluate(
    sessionId,
    "window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', code: 'Backquote', bubbles: true })); true",
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-debug-control-rail:not([hidden])') && document.querySelector('.adventure-game-tools-open')",
      ),
    ),
  );
}

async function verifyReplayPanel(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForReplayPanelReady(cdp, sessionId);
  await verifyReplaySaveButton(cdp, sessionId);
  await clickWhenPresent(cdp, sessionId, "#replay-record");
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "!document.querySelector('[data-replay-panel]')?.hidden",
      ),
    ),
  );
  await verifyReplayPanelShortcut(cdp, sessionId);
  const desktopLayout = await replayLayout(cdp, sessionId);
  if (desktopLayout.canvasLeft < desktopLayout.panelRight - 1)
    throw new Error("Replay desktop panel did not reserve canvas space");

  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-replay-panel]')?.classList.contains('recording')",
      ),
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowRight", 39);
  await new Promise((resolve) => setTimeout(resolve, 200));
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowRight", 39);
  await waitFor(async () =>
    !String(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-replay-ticks]')?.textContent ?? ''",
      ),
    ).includes(" 0 ticks"),
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const verification = document.querySelector('[data-replay-verification]');
          return Boolean(
            verification &&
            !verification.classList.contains('failed') &&
            verification.textContent?.includes('ticks')
          );
        })()`,
      ),
    ),
  );
  const replay = await cdp.evaluate(
    sessionId,
    "JSON.parse(document.querySelector('[data-replay-output]').value)",
  );
  if (replay.formatVersion !== 1 || replay.endTick < 1 || replay.frames.length < 1)
    throw new Error(
      `Replay panel did not export recorded World input: ${JSON.stringify(replay)}`,
    );
  if (
    replay.meta?.id !== "imported/shared-map" ||
    typeof replay.meta.url !== "string" ||
    replay.meta.url !== url.replace(new URL(url).origin, "https://bc5r.xujinkai.net") ||
    replay.meta.note !== ""
  )
    throw new Error("Replay panel did not export map metadata");
  if (
    "levelHash" in replay ||
    Object.keys(replay).at(-1) !== "frames"
  )
    throw new Error("Replay export did not use the compact field layout");
  if (
    !["playing", "won", "dead"].includes(replay.finalState?.status) ||
    !Number.isInteger(replay.finalState?.moves) ||
    !Array.isArray(replay.finalState?.position) ||
    !Number.isInteger(replay.finalState?.elapsedMs) ||
    typeof replay.finalState?.counters !== "object" ||
    !Array.isArray(replay.finalState?.completedConditions)
  )
    throw new Error("Replay panel did not export finalState");
  const replayText = await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-output]').value",
  );
  const serializedFrameLines = replayText
    .split("\n")
    .filter((line) => /"tick":\d+/.test(line));
  if (
    serializedFrameLines.length !== replay.frames.length ||
    serializedFrameLines.some((line) => !/^    \{.*\},?$/.test(line))
  )
    throw new Error("Replay panel did not serialize one frame per line");
  if ("profile" in replay.runtime || "economy" in replay.runtime)
    throw new Error("Replay runtime included Explore session settings");
  if ("snapshot" in replay || "entities" in replay)
    throw new Error("Replay export included runtime state");
  const controls = await cdp.evaluate(
    sessionId,
    `(() => ({
      editable: !document.querySelector('[data-replay-output]').readOnly,
      speedType: document.querySelector('[data-replay-speed]')?.type,
      speedValue: document.querySelector('[data-replay-speed]')?.value,
      actions: [...document.querySelectorAll('[data-replay-action]')]
        .map((button) => ({
          action: button.dataset.replayAction,
          label: button.textContent.trim(),
        })),
    }))()`,
  );
  if (!controls.editable)
    throw new Error("Replay output was not editable");
  if (controls.speedType !== "number" || controls.speedValue !== "1")
    throw new Error("Replay playback speed was not an editable number");
  for (const action of [
    "play",
    "stop-playback",
    "beginning",
    "end",
    "copy",
    "download",
    "load-builtin",
  ])
    if (!controls.actions.some((button) => button.action === action))
      throw new Error(`Replay panel action missing: ${action}`);
  for (const action of ["slower", "faster"])
    if (!controls.actions.some((button) => button.action === action))
      throw new Error(`Replay speed action missing: ${action}`);
  await cdp.send(
    "Runtime.evaluate",
    {
      expression: `(() => {
        const input = document.querySelector('[data-replay-speed]');
        input.value = '1.3';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('[data-replay-action="faster"]').click();
      })()`,
      awaitPromise: true,
    },
    sessionId,
  );
  const adjustedSpeed = await cdp.send(
    "Runtime.evaluate",
    {
      expression: "document.querySelector('[data-replay-speed]').value",
      returnByValue: true,
    },
    sessionId,
  );
  if (adjustedSpeed.result.value !== "1.5")
    throw new Error("Replay speed preset adjustment did not use the next value");
  const playbackControls = await cdp.evaluate(
    sessionId,
    `(() => {
      const input = document.querySelector('[data-replay-speed]');
      const play = document.querySelector('[data-replay-action="play"]');
      const stop = document.querySelector('[data-replay-action="stop-playback"]');
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      play.click();
      const invalidRejected = input.getAttribute('aria-invalid') === 'true';
      input.value = '20';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      play.click();
      const runningLabel = play.textContent.trim();
      const stopWasEnabled = !stop.disabled;
      play.click();
      const pausedLabel = play.textContent.trim();
      const pausedStatus = document.querySelector('[data-replay-status]').textContent;
      stop.click();
      return {
        invalidRejected,
        runningLabel,
        stopWasEnabled,
        pausedLabel,
        pausedStatus,
        stopDisabledAfterExit: stop.disabled,
        speedValue: input.value,
        speedInvalidAfterEdit: input.hasAttribute('aria-invalid'),
        messagePresent: Boolean(document.querySelector('[data-replay-message]')),
      };
    })()`,
  );
  if (!playbackControls.invalidRejected)
    throw new Error("Replay playback accepted an empty speed");
  if (
    !["暂停", "Pause"].includes(playbackControls.runningLabel) ||
    !playbackControls.stopWasEnabled ||
    !["播放", "Play"].includes(playbackControls.pausedLabel) ||
    !["播放已暂停", "Playback paused"].includes(playbackControls.pausedStatus)
  )
    throw new Error("Replay play, pause and stop controls did not reflect state");
  if (
    !playbackControls.stopDisabledAfterExit ||
    playbackControls.speedValue !== "20" ||
    playbackControls.speedInvalidAfterEdit
  )
    throw new Error("Replay playback did not accept an unrestricted positive speed");
  if (playbackControls.messagePresent)
    throw new Error("Replay panel still mounted the variable-height message");

  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"load-builtin\"]')?.click(); true",
  );
  await waitFor(async () =>
    ["当前关卡暂无内置过法", "No built-in solution is available for this level"].includes(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-replay-verification]')?.textContent ?? ''",
      ),
    ),
  );

  await cdp.evaluate(
    sessionId,
    "window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', code: 'Backquote', bubbles: true })); true",
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-debug-control-rail')",
      ),
    ),
  );
  const engineSpeeds = await cdp.evaluate(
    sessionId,
    `([...document.querySelectorAll('.engine-debug-control-rail label')]
      .filter((label) => label.firstChild?.textContent === 'Speed')
      .map((label) => label.querySelector('select')?.value))`,
  );
  if (engineSpeeds.length !== 2 || engineSpeeds.some((speed) => speed !== "20"))
    throw new Error("Replay panel time scale did not persist in both Engine clocks");

  const debugLayout = await cdp.evaluate(
    sessionId,
    `(() => ({
      tabs: [...document.querySelectorAll('[data-debug-tab]')]
        .map((button) => button.dataset.debugTab),
      inspectVisible: !document.querySelector('[data-debug-tab-panel="inspect"]')?.hidden,
      worldTicksChecked: document.querySelector('[data-debug-timeline-world-ticks]')?.checked,
    }))()`,
  );
  if (debugLayout.tabs.join(",") !== "inspect,timeline,actor,world")
    throw new Error("Engine Debug tabs did not use the expected order");
  if (!debugLayout.inspectVisible || debugLayout.worldTicksChecked !== false)
    throw new Error("Engine Debug did not open Inspect with World ticks filtered");

  await cdp.evaluate(
    sessionId,
    `(() => {
      document.querySelector('[data-debug-tab="world"]').click();
      const input = document.querySelector('[data-debug-intent-move-duration]');
      input.value = '123';
      document.querySelector('[data-debug-intent-dispatch]').click();
      return true;
    })()`,
  );
  await waitFor(async () =>
    String(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-debug-tab-panel=\"world\"]')?.textContent ?? ''",
      ),
    ).includes('"moveDurationMs": 123'),
  );
  const worldText = await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-debug-tab-panel=\"world\"]')?.textContent ?? ''",
  );
  if (worldText.includes("initialIntents") || !worldText.includes("bobbyLocomotion"))
    throw new Error("Engine Debug World did not expose the move-only Replay setup");
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-debug-tab=\"timeline\"]')?.click(); true",
  );
  const timelineText = await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-debug-tab-panel=\"timeline\"]')?.textContent ?? ''",
  );
  if (!timelineText.includes("set-actor-locomotion"))
    throw new Error("Engine Debug intent injection did not enter Timeline");

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 760, deviceScaleFactor: 1, mobile: true },
    sessionId,
  );
  await cdp.evaluate(
    sessionId,
    "window.__replayPanelReloadProbe = true; true",
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const panel = document.querySelector('[data-replay-panel]');
          return window.__replayPanelReloadProbe !== true &&
            document.querySelector('#replay-record') && panel && !panel.hidden;
        })()`,
      ),
    ),
    20_000,
  );
  const mobileLayout = await replayLayout(cdp, sessionId);
  if (Math.abs(mobileLayout.canvasLeft - mobileLayout.stageLeft) > 1)
    throw new Error("Replay mobile panel changed the canvas layout");
  if (mobileLayout.panelLeft < mobileLayout.stageLeft + 9)
    throw new Error("Replay mobile panel did not float inside the game stage");
}

async function verifyReplaySaveButton(cdp, sessionId) {
  const adjacent = await cdp.evaluate(
    sessionId,
    `(() => {
      const load = document.querySelector('[data-replay-action="load-builtin"]');
      const save = document.querySelector('[data-replay-action="save-builtin"]');
      return Boolean(load && save && load.parentElement === save.parentElement);
    })()`,
  );
  if (!adjacent) throw new Error("内置过法加载与保存按钮未并排显示");
}

async function waitForReplayPanelReady(cdp, sessionId) {
  await waitFor(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          `(() => {
            const shellButton = document.querySelector('#replay-record');
            const panel = document.querySelector('[data-replay-panel]');
            const status = panel?.querySelector('[data-replay-status]');
            const record = panel?.querySelector('[data-replay-action="record"]');
            return shellButton && panel && status?.textContent && record?.textContent;
          })()`,
        ),
      ),
    20_000,
  );
}

async function clickWhenPresent(cdp, sessionId, selector) {
  await waitFor(async () =>
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

async function openPage(cdp, url) {
  const { targetId } = await cdp.send("Target.createTarget", { url });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  return sessionId;
}

async function dispatchKey(
  cdp,
  sessionId,
  type,
  key,
  windowsVirtualKeyCode,
  autoRepeat = false,
) {
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type, key, code: key, windowsVirtualKeyCode, autoRepeat },
    sessionId,
  );
}

function dialogPayload() {
  const map = {
    schemaVersion: 1,
    meta: {
      name: "Dialog Browser Regression",
      author: "bc5r",
    },
    width: 2,
    height: 3,
    rules: { win: { type: "exit" } },
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 0, y: 1, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 1, variant: "ts-10-1" },
      { type: "grass", x: 0, y: 2, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 2, variant: "ts-10-1" },
      { type: "start", x: 1, y: 2 },
      { type: "bobby", x: 1, y: 2 },
      {
        type: "beaver",
        x: 1,
        y: 1,
        dialogue: [
          "你的金钥匙可以直接打开这把锁。",
          "向着海狸的方向按键可以继续交谈。",
        ],
      },
      { type: "exit", x: 0, y: 0 },
    ],
  };
  return gzipSync(Buffer.from(JSON.stringify(map), "utf8")).toString("base64url");
}

function replayPayload() {
  const map = {
    schemaVersion: 1,
    meta: { name: "Replay Browser Regression", author: "bc5r" },
    width: 3,
    height: 1,
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 2, y: 0, variant: "ts-10-1" },
      { type: "bobby", x: 0, y: 0 },
    ],
  };
  return gzipSync(Buffer.from(JSON.stringify(map), "utf8")).toString("base64url");
}

const waitFor = waitForBrowserState;
