import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { createServer } from "vite";
import { root } from "../lib/fs.mjs";
import { verifyEditorCanvasPerformance } from "./editor-performance-browser.mjs";

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
      await verifyMusicInteractionTip(cdp, `${origin}/`);
      await verifyQuickSettings(cdp, `${origin}/`);
      await verifySettingsPage(cdp, `${origin}/settings`);
      await verifyEditorSurfaceInspector(cdp, `${origin}/edit`);
      await verifyReplayPanel(cdp, `${origin}/import/v1#${replayPayload()}`);
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
  await waitFor(async () =>
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

async function verifySettingsPage(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await waitFor(async () =>
    Boolean(await cdp.evaluate(sessionId, "document.querySelector('.settings-page')")),
  );
  const snapshot = await cdp.evaluate(
    sessionId,
    `(() => ({
      cards: document.querySelectorAll('.save-management-card').length,
      text: document.querySelector('.settings-page')?.textContent ?? ''
    }))()`,
  );
  if (snapshot.cards < 2 || !snapshot.text.includes("Adventure") || !snapshot.text.includes("Explore"))
    throw new Error("Settings save management did not expose Adventure and Explore cards");
}

async function verifyEditorSurfaceInspector(cdp, url) {
  const sessionId = await openPage(cdp, url);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-canvas') && document.querySelector('.editor-surface-panel')",
      ),
    ),
    20_000,
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
    { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 },
    sessionId,
  );
  await waitFor(async () =>
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
  if (snapshot.selects !== 0 || !snapshot.nextTitle)
    throw new Error("Surface Inspector did not expose a visual-only variant grid");
  if (snapshot.text.includes("使用未注册 type"))
    throw new Error("Editor reported an unregistered canonical Entity type");
  await waitFor(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.editor-layer-card .editor-surface-variant-btn.active')?.getAttribute('title') ?? ''",
    )) === snapshot.nextTitle,
  );

  await cdp.evaluate(
    sessionId,
    "document.querySelector('#editor-palette')?.click(); true",
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-palette-type=\"egg\"]')",
      ),
    ),
  );
  const eggPoint = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = document.querySelector('[data-palette-type="egg"]');
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  if (!eggPoint) throw new Error("Egg Palette item was not measurable");
  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mouseMoved", x: eggPoint.x, y: eggPoint.y },
    sessionId,
  );
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-palette-tooltip')",
      ),
    ),
  );
  const eggTooltip = await cdp.evaluate(
    sessionId,
    `(() => {
      const tooltip = document.querySelector('.editor-palette-tooltip');
      return {
        name: tooltip?.querySelector('strong')?.textContent ?? '',
        type: tooltip?.querySelector('code')?.textContent ?? '',
      };
    })()`,
  );
  if (eggTooltip.name !== "Egg" || eggTooltip.type !== "egg")
    throw new Error(`Egg Palette tooltip was incorrect: ${JSON.stringify(eggTooltip)}`);
  await verifyEditorCanvasPerformance(cdp, sessionId);
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

  await dispatchKey(cdp, sessionId, "keyDown", "ArrowDown", 40);
  await waitFor(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.engine-gameplay-dialog')?.hidden",
      ),
    ),
  );
  await dispatchKey(cdp, sessionId, "keyUp", "ArrowDown", 40);
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
  await dispatchKey(cdp, sessionId, "keyDown", "ArrowRight", 39);
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
    ).includes("复验通过"),
  );
  const replay = await cdp.evaluate(
    sessionId,
    "JSON.parse(document.querySelector('[data-replay-output]').value)",
  );
  if (replay.formatVersion !== 1 || replay.endTick < 1 || replay.frames.length < 1)
    throw new Error("Replay panel did not export recorded World input");
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
  for (const label of ["播放", "停止", "跳到起点", "跳到终点", "复制", "下载"])
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

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 760, deviceScaleFactor: 1, mobile: true },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitFor(async () =>
    Boolean(await cdp.evaluate(sessionId, "document.querySelector('#replay-record')")),
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
  const mobileLayout = await replayLayout(cdp, sessionId);
  if (Math.abs(mobileLayout.canvasLeft - mobileLayout.stageLeft) > 1)
    throw new Error("Replay mobile panel changed the canvas layout");
  if (mobileLayout.panelLeft < mobileLayout.stageLeft + 9)
    throw new Error("Replay mobile panel did not float inside the game stage");
}

async function replayLayout(cdp, sessionId) {
  return cdp.evaluate(
    sessionId,
    `(() => {
      const stage = document.querySelector('[data-game-stage]').getBoundingClientRect();
      const panel = document.querySelector('[data-replay-panel]').getBoundingClientRect();
      const canvas = document.querySelector('.game-canvas-layer').getBoundingClientRect();
      return {
        stageLeft: stage.left,
        panelLeft: panel.left,
        panelRight: panel.right,
        canvasLeft: canvas.left,
      };
    })()`,
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
      { type: "start", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0 },
      {
        type: "beaver",
        x: 1,
        y: 0,
        interaction: "bonus-key-vendor",
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

async function waitFor(check, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Browser regression interaction timed out");
}

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
