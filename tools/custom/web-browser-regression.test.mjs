import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { createServer } from "vite";
import { root } from "../lib/fs.mjs";
import { verifyButtonFocusPolicy } from "./button-focus-browser-checks.mjs";
import { waitForBrowserState } from "./browser-regression-wait.mjs";
import { verifyEditorExperience } from "./editor-browser-checks.mjs";
import {
  replayLayout,
  verifyReplayPanelShortcut,
} from "./replay-browser-checks.mjs";
import { verifySettingsPage } from "./settings-browser-checks.mjs";

const browserEnvironment = { ...process.env };
delete browserEnvironment.DISPLAY;
delete browserEnvironment.WAYLAND_DISPLAY;
delete browserEnvironment.XAUTHORITY;

test(
  "Web browser regressions cover settings, Replay UI and Engine Dialog lifecycle",
  { timeout: 90_000 },
  async () => {
    const browser = findBrowser();
    if (!browser)
      throw new Error(
        "Browser regression requires Chrome/Chromium. Set BROWSER_PATH if it is not on PATH.",
      );

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

    const child = spawn(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--remote-debugging-pipe",
        "about:blank",
      ],
      {
        env: browserEnvironment,
        stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"],
      },
    );
    const input = child.stdio[3];
    const output = child.stdio[4];
    if (!input || !output) {
      child.kill("SIGKILL");
      await vite.close();
      throw new Error("Chromium CDP pipe failed to open");
    }
    const cdp = createCdpPipe(input, output);
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
      await verifyAdventureDeveloperTools(
        cdp,
        `${origin}/adventure/play/1-1`,
      );
      await verifyGameplayDialog(cdp, `${origin}/import/v1#${dialogPayload()}`);
    } finally {
      cdp.close();
      child.kill("SIGKILL");
      await vite.close();
    }
  },
);

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
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowRight", 39);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog:not([hidden])')",
      ),
    ),
  );
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowRight", 39);

  const text = await cdp.evaluate(
    sessionId,
    "document.querySelector('.engine-gameplay-dialog-text')?.textContent ?? ''",
  );
  if (text !== "你的金钥匙可以直接打开这把锁。")
    throw new Error(`Engine Dialog rendered unexpected text: ${text}`);

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
}

async function verifyAdventureDeveloperTools(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitFor(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('#replay-record') && document.querySelector('[data-replay-panel]')",
        ),
      ),
    20_000,
  );

  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"load-builtin\"]')?.click(); true",
  );
  await waitFor(async () =>
    String(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-replay-verification]')?.textContent ?? ''",
      ),
    ).includes("内置过法已载入"),
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
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('#replay-record') && document.querySelector('[data-replay-panel]')",
      ),
    ),
    20_000,
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
  const desktopLayout = await replayLayout(cdp, sessionId);
  if (desktopLayout.canvasLeft < desktopLayout.panelRight - 1)
    throw new Error("Replay desktop panel did not reserve canvas space");

  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );
  await waitFor(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-replay-status]')?.textContent ?? ''",
    )) === "正在录制",
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
    String(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-replay-verification]')?.textContent ?? ''",
      ),
    ).includes("复跑完成"),
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
    !Number.isInteger(replay.finalState?.elapsedMs) ||
    typeof replay.finalState?.counters !== "object" ||
    !Array.isArray(replay.finalState?.completedConditions)
  )
    throw new Error("Replay panel did not export finalState");
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
  for (const label of [
    "播放",
    "停止",
    "跳到起点",
    "跳到终点",
    "复制",
    "下载",
    "加载内置过法",
  ])
    if (!controls.actions.some((action) => action.label === label))
      throw new Error(`Replay panel action missing: ${label}`);
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
    playbackControls.runningLabel !== "暂停" ||
    !playbackControls.stopWasEnabled ||
    playbackControls.pausedLabel !== "播放" ||
    playbackControls.pausedStatus !== "播放已暂停"
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
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-replay-verification]')?.textContent ?? ''",
    )) === "当前关卡暂无内置过法",
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
  if (!worldText.includes("initialIntents") || !worldText.includes("bobbyLocomotion"))
    throw new Error("Engine Debug World did not expose setup and initial intents");
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

async function dispatchKey(cdp, sessionId, type, key, windowsVirtualKeyCode) {
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type, key, code: key, windowsVirtualKeyCode },
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
    height: 2,
    rules: { win: { type: "reach", target: "exit" } },
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 0, y: 1, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 1, variant: "ts-10-1" },
      { type: "start", x: 0, y: 1 },
      { type: "bobby", x: 0, y: 1 },
      {
        type: "beaver",
        x: 1,
        y: 0,
        dialogue: "你的金钥匙可以直接打开这把锁。",
      },
      { type: "exit", x: 1, y: 1 },
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

function createCdpPipe(input, output) {
  let nextId = 1;
  let buffer = "";
  const pending = new Map();
  output.on("data", (chunk) => {
    buffer += chunk.toString();
    let boundary = buffer.indexOf("\0");
    while (boundary >= 0) {
      const packet = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);
      if (packet) {
        const message = JSON.parse(packet);
        const request = message.id ? pending.get(message.id) : undefined;
        if (request) {
          pending.delete(message.id);
          if (message.error) request.reject(new Error(message.error.message));
          else request.resolve(message.result ?? {});
        }
      }
      boundary = buffer.indexOf("\0");
    }
  });
  return {
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        input.write(`${JSON.stringify({ id, method, params, sessionId })}\0`);
      });
    },
    async evaluate(sessionId, expression) {
      const response = await this.send(
        "Runtime.evaluate",
        { expression, returnByValue: true },
        sessionId,
      );
      if (response.exceptionDetails)
        throw new Error(`Browser evaluation failed: ${expression}`);
      return response.result?.value;
    },
    close() {
      input.end();
      for (const request of pending.values())
        request.reject(new Error("Chromium CDP pipe closed"));
      pending.clear();
    },
  };
}

const waitFor = waitForBrowserState;

function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    process.platform === "linux" ? "/usr/bin/chromium" : null,
    process.platform === "linux" ? "/usr/lib/chromium/chromium" : null,
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : null,
    process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : null,
    process.platform === "win32"
      ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
      : null,
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate)) {
      const probe = spawnSync(candidate, ["--version"], {
        encoding: "utf8",
        env: browserEnvironment,
        timeout: 5000,
      });
      if (!probe.error && probe.status === 0) return candidate;
      continue;
    }
    const probe = spawnSync(candidate, ["--version"], {
      encoding: "utf8",
      env: browserEnvironment,
      timeout: 5000,
    });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}
