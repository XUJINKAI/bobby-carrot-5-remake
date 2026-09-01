import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { createServer } from "vite";
import { root } from "../lib/fs.mjs";

const browserEnvironment = { ...process.env };
delete browserEnvironment.DISPLAY;
delete browserEnvironment.WAYLAND_DISPLAY;
delete browserEnvironment.XAUTHORITY;

test(
  "Web browser regressions cover settings, themes and Engine Dialog lifecycle",
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
      await verifyQuickSettings(cdp, `${origin}/`);
      await verifySettingsPage(cdp, `${origin}/settings`);
      await verifyGameplayDialog(cdp, `${origin}/import/v1#${dialogPayload()}`);
    } finally {
      cdp.close();
      child.kill("SIGKILL");
      await vite.close();
    }
  },
);

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
  if (text !== "dialog smoke")
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
    name: "Dialog Browser Regression",
    author: "bc5r",
    description: "Engine Dialog browser regression fixture",
    width: 2,
    height: 2,
    rules: { win: { type: "reach", trait: "exit" } },
    entities: [
      { type: "ground-c", x: 0, y: 0 },
      { type: "ground-c", x: 1, y: 0 },
      { type: "ground-c", x: 0, y: 1 },
      { type: "ground-c", x: 1, y: 1 },
      { type: "start", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0, direction: "right" },
      {
        type: "sandman",
        x: 1,
        y: 0,
        direction: "down",
        properties: { dialog: { message: "dialog smoke" } },
      },
      { type: "exit", x: 1, y: 1 },
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
