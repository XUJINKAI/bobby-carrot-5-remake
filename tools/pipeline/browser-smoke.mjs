import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { BC5R_GAME_ID } from "../../model/dist/index.js";
import { root } from "../lib/fs.mjs";
import { serveDistRequest } from "../lib/static-server.mjs";
const browserEnvironment = { ...process.env };
delete browserEnvironment.DISPLAY;
delete browserEnvironment.WAYLAND_DISPLAY;
delete browserEnvironment.XAUTHORITY;
const webRoot = path.join(root, "dist");
if (!fs.existsSync(path.join(webRoot, "index.html")))
  throw new Error("dist is missing; run npm run build first");
const browser = findBrowser();
if (!browser)
  throw new Error(
    "Browser smoke test requires Chrome/Chromium. Set BROWSER_PATH if it is not on PATH.",
  );
const server = http.createServer((request, response) => {
  if (
    request.url === "/assets/maps/original/unlisted-smoke.json" ||
    request.url === "/assets/maps/standalone-smoke/standalone.json"
  ) {
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    fs.createReadStream(
      path.join(webRoot, "assets/maps/original/1-1.json"),
    ).pipe(response);
    return;
  }
  if (
    request.url === "/explore/play/original/unlisted-smoke" ||
    request.url === "/explore/play/standalone-smoke/standalone"
  ) {
    request.url = "/";
  }
  serveDistRequest(webRoot, request, response);
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
try {
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Failed to determine smoke-test server port");
  const origin = `http://127.0.0.1:${address.port}`;
  await smoke(
    `${origin}/`,
    [
      "data-shell",
      'class="home-mode-panel"',
      'class="home-sky-brand"',
      'class="home-demo-screen-control"',
      'href="https://github.com/XUJINKAI/bobby-carrot-5-remake"',
      "导入地图",
      "导入自定义地图或存档",
    ],
    ["本项目还在开发中"],
  );
  await interactiveDataExchangeSmoke(`${origin}/`);
  await smoke(`${origin}/embed`, ['class="embed-page"', "BC5R Embed v1"]);
  await expectStatus(`${origin}/embed/v1/bc5r.js`, 200, "text/javascript");
  await smoke(
    `${origin}/explore`,
    [
      'class="explore-tabs"',
      'class="level-browser-head"',
      'class="level-filter-shell"',
      'data-filter-trigger="targets"',
      'data-filter-trigger="target-count"',
      'data-filter-trigger="mechanics"',
      'data-card-size="small"',
      "Special Scenes",
      "Dreamland Reward",
      'href="/explore/play/original/campaign-intro"',
    ],
    ["进入冒险模式"],
  );
  await interactiveFilterSmoke(`${origin}/explore`);
  await smoke(`${origin}/explore/novoban-pushbox`, [
    'class="explore-tabs"',
    'class="explore-ungrouped-maps"',
    'data-card-size="medium"',
    "Novoban",
    "01 · Be ban 10",
  ]);
  await smoke(
    `${origin}/explore/loma-pushbox`,
    [
      'class="explore-tabs"',
      'class="chapter-card"',
      'data-card-size="small"',
      "LOMA",
      'href="/explore/play/loma-pushbox/01-01"',
    ],
    ['class="chapter-name"', 'class="chapter-separator"'],
  );
  await smoke(
    `${origin}/explore/engine-lab`,
    [
      'class="explore-ungrouped-maps"',
      'data-card-size="medium"',
      'href="/explore/play/engine-lab/00-intro"',
      'href="/explore/play/engine-lab/01-control2"',
    ],
    ['class="chapter-name"', 'class="chapter-separator"'],
  );
  await smoke(`${origin}/explore/play/loma-pushbox/01-01`, [
    'class="game-page"',
    'id="game"',
    'class="shell-indicator-button tone-muted"',
    'aria-label="尚未进行通关验证"',
    "01-01",
  ]);
  await smoke(`${origin}/explore/play/original/1-1`, [
    'class="game-page"',
    'id="game"',
    'id="replay-record"',
    "data-replay-panel",
    'id="undo"',
    'id="redo"',
    'id="previous-level"',
    'id="next-level"',
    'aria-label="上一关"',
    'aria-label="下一关"',
    'class="shell-topbar-left"',
    'class="shell-topbar-center"',
    'class="shell-topbar-right"',
    'class="shell-indicator-button tone-success"',
    'aria-label="已验证可通关"',
  ]);
  await smoke(
    `${origin}/explore/play/original/unlisted-smoke`,
    [
      'class="game-page"',
      'id="game"',
      'aria-label="尚未进行通关验证"',
    ],
  );
  await smoke(
    `${origin}/explore/play/standalone-smoke/standalone`,
    [
      'class="game-page"',
      'id="game"',
      'aria-label="尚未进行通关验证"',
    ],
  );
  await interactiveReplayVerificationSmoke(
    `${origin}/explore/play/original/1-1`,
  );
  await smoke(`${origin}/explore/play/novoban-pushbox/01`, [
    'class="game-page"',
    'id="game"',
    "01 · Be ban 10",
  ]);
  await smoke(`${origin}/adventure`, [
    "adventure-viewport-auto",
    'class="adventure-menu"',
    'class="shell-context-name">冒险模式',
  ]);
  await smoke(`${origin}/adventure/chapters`, [
    'class="adventure-chapters"',
    'class="chapter-stars"',
    'class="shell-context-name">冒险模式',
    'href="/adventure/chapter/1"',
    'href="/adventure/chapter/5"',
    'href="/adventure/chapter/37"',
  ]);
  await smoke(`${origin}/adventure/chapter/1`, [
    'class="adventure-level-list"',
    "1-BONUS-1",
    'class="adventure-level-row locked"',
  ]);
  await smoke(
    `${origin}/adventure/play/1-1`,
    [
      "original-adventure-game",
      'id="game"',
      'class="shell-indicator-button tone-success"',
      'aria-label="已在自由探索模式中验证可通关"',
    ],
    ['id="undo"', 'id="replay-record"', "data-replay-panel"],
  );
  await smoke(`${origin}/edit`, [
    "bobby-editor",
    'id="editor-play"',
    'id="editor-share"',
    'data-palette-type="egg"',
  ]);
  await interactiveEditorSourceSmoke(
    `${origin}/edit#map=novoban-pushbox/01`,
  );
  const mapPayload = exchangePayload(
    fs.readFileSync(
      path.join(root, "tools/pipeline/mechanics-smoke.json"),
      "utf8",
    ),
  );
  const { createAdventureSave, serializeAdventureSave } = await import(
    "../../adventure/dist/index.js"
  );
  const profilePayload = exchangePayload(
    serializeAdventureSave(createAdventureSave()),
  );
  await smoke(`${origin}/import/v1#${mapPayload}`, [
    'class="game-page"',
    'id="game"',
  ]);
  await smoke(`${origin}/import/v1#${profilePayload}`, [
    'class="import-page"',
    'class="shell-context-name">导入',
    "Adventure Save",
    "导入并覆盖",
  ]);
  const explorePayload = exchangePayload(JSON.stringify({
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    mode: "explore",
    collections: {},
  }));
  await smoke(`${origin}/import/v1#${explorePayload}`, [
    'class="import-page"',
    "Explore Save",
    "导入并覆盖",
  ]);
  await smoke(`${origin}/import/v1#${exchangePayload("{}")}`, [
    'class="import-page"',
    "无法识别这段 Bobby Carrot 5 Remake 数据",
  ]);
  await smoke(`${origin}/import/v1#INVALID`, [
    'class="import-page"',
    "BC5R1",
  ]);
  await expectStatus(`${origin}/robots.txt`, 200, "text/plain");
  await expectStatus(`${origin}/sitemap.xml`, 200, "application/xml");
  await expectStatus(`${origin}/edit/novoban-pushbox/01`, 404, "text/plain");
  await expectStatus(`${origin}/explore/original`, 404, "text/plain");
  await expectStatus(`${origin}/this-route-does-not-exist`, 404, "text/plain");
  await expectStatus(`${origin}/assets/does-not-exist.png`, 404, "text/plain");
  await expectStatus(`${origin}/engine/missing.js`, 404, "text/plain");
  await expectStatus(`${origin}/model/missing`, 404, "text/plain");
  await expectStatus(`${origin}/adventure/missing.js`, 404, "text/plain");
  console.log(
    `browser smoke: OK — ${path.basename(browser)} loaded generated SPA route shells while unknown routes and missing static resources returned 404`,
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}

function exchangePayload(text) {
  return gzipSync(Buffer.from(text, "utf8")).toString("base64url");
}
async function expectStatus(url, expectedStatus, typePrefix) {
  const response = await fetch(url);
  if (response.status !== expectedStatus)
    throw new Error(
      `Expected ${url} -> ${expectedStatus}, got ${response.status}`,
    );
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith(typePrefix))
    throw new Error(`Expected ${url} content-type ${typePrefix}, got ${type}`);
  const body = await response.text();
  if (expectedStatus === 404 && body.includes('<div id="app">'))
    throw new Error(`404 request ${url} incorrectly received SPA HTML`);
}
async function smoke(url, expected, forbidden = []) {
  const result = await runBrowser(url, expected);
  if (result.status !== 0)
    throw new Error(
      `Browser failed for ${url} (exit ${result.status})\n${result.stderr || result.stdout}`,
    );
  for (const fragment of expected)
    if (!result.stdout.includes(fragment))
      throw new Error(
        `Browser did not mount expected app for ${url}; missing ${fragment}\n${compact(result.stdout)}\n${compact(result.stderr)}`,
      );
  for (const fragment of forbidden)
    if (result.stdout.includes(fragment))
      throw new Error(
        `Browser mounted forbidden content for ${url}; found ${fragment}\n${compact(result.stdout)}\n${compact(result.stderr)}`,
      );
  const diagnostics = `${result.stderr}\n${result.stdout}`,
    fatal = [
      /Failed to resolve module specifier/i,
      /blocked by a null value/i,
      /Uncaught TypeError/i,
      /Uncaught ReferenceError/i,
    ].find((pattern) => pattern.test(diagnostics));
  if (fatal)
    throw new Error(
      `Browser reported a fatal module/runtime error for ${url}: ${fatal}`,
    );
}
async function runBrowser(url, expected) {
  const result = await runBrowserEval(
    url,
    `(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const expected = ${JSON.stringify(expected)};
      const snapshot = () => {
        const errors = globalThis.__bc5rSmokeErrors?.join("\\n") ?? "";
        return errors + "\\n" + document.documentElement.outerHTML;
      };
      for (let i = 0; i < 120; i += 1) {
        const html = document.documentElement.outerHTML;
        if (expected.every((fragment) => html.includes(fragment)))
          return snapshot();
        await delay(50);
      }
      return snapshot();
    })()`,
  );
  return {
    status: result.status,
    stdout: typeof result.value === "string" ? result.value : result.stdout,
    stderr: result.stderr,
  };
}
function findBrowser() {
  const configured = process.env.BROWSER_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  for (const name of ["google-chrome", "chromium", "chromium-browser"]) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0) return result.stdout.trim();
  }
  return null;
}
function compact(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 9000);
}
async function interactiveFilterSmoke(url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const find = (selector) => document.querySelector(selector);
  for (let i = 0; i < 120 && !find('[data-filter-trigger="target-count"]'); i += 1)
    await delay(50);
  const trigger = find('[data-filter-trigger="target-count"]');
  if (!trigger) throw new Error('missing target count trigger');
  trigger.click();
  await delay(80);
  const option = find('[data-filter-group="target-count"][data-filter-option]');
  if (!option) throw new Error('missing target count filter option');
  const optionId = option.getAttribute('data-filter-option');
  option.click();
  await delay(80);
  const currentTrigger = find('[data-filter-trigger="target-count"]');
  const currentOption = optionId
    ? find('[data-filter-group="target-count"][data-filter-option="' + optionId + '"]')
    : null;
  const mowerIcons = find('[data-filter-group="mechanics"][data-filter-option="mower"]')
    ?.querySelectorAll('.level-filter-icon').length;
  return JSON.stringify({
    active: Boolean(currentTrigger?.classList.contains('active')),
    selected: Boolean(currentOption?.classList.contains('selected')),
    cards: document.querySelectorAll('[data-map-id]:not(.filter-hidden)').length,
    mowerIcons,
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Interactive filter smoke failed: ${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (!payload.active || !payload.selected || payload.cards <= 0 || payload.mowerIcons !== 2)
    throw new Error(`Unexpected filter smoke result: ${JSON.stringify(payload)}`);
}
async function interactiveReplayVerificationSmoke(url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let button = null;
  for (let i = 0; i < 120 && !button; i += 1) {
    await delay(50);
    button = document.querySelector('#replay-verification');
  }
  if (!button) throw new Error('missing replay verification icon');
  button.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  await delay(30);
  const hover = document.querySelector('[role="tooltip"]')?.textContent;
  button.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  button.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
  button.click();
  await delay(30);
  const touch = document.querySelector('[role="tooltip"]')?.textContent;
  document.body.dispatchEvent(new PointerEvent('pointerdown', {
    pointerType: 'touch',
    bubbles: true,
  }));
  await delay(30);
  const dismissed = !document.querySelector('[role="tooltip"]');
  return JSON.stringify({ hover, touch, dismissed });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Replay 验真 tooltip 检查失败：${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (
    payload.hover !== "已验证可通关" ||
    payload.touch !== payload.hover ||
    !payload.dismissed
  )
    throw new Error(`Replay 验真 tooltip 状态异常：${JSON.stringify(payload)}`);
}
async function interactiveDataExchangeSmoke(url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 120 && !document.querySelector('[data-home-import]'); i += 1)
    await delay(50);
  const importButton = document.querySelector('[data-home-import]');
  if (!importButton) throw new Error('missing import button');
  importButton.click();
  const source = {
    game: ${JSON.stringify(BC5R_GAME_ID)},
    schemaVersion: 1,
    mode: 'explore',
    collections: {
      original: {
        game: ${JSON.stringify(BC5R_GAME_ID)},
        schemaVersion: 1,
        completedMaps: ['1-1'],
        lastMap: '1-1',
      },
    },
  };
  let textarea = null;
  for (let i = 0; i < 120 && !textarea; i += 1) {
    await delay(50);
    textarea = document.querySelector('.home-import-dialog textarea');
  }
  if (!textarea) throw new Error('missing import textarea');
  textarea.value = JSON.stringify(source);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  const open = [...document.querySelectorAll('.home-import-dialog button')]
    .find((button) => button.textContent?.trim() === '打开');
  if (!open) throw new Error('missing open button');
  open.click();
  for (let i = 0; i < 120 && !document.querySelector('.import-save-confirmation'); i += 1)
    await delay(50);
  const confirmation = document.querySelector('.import-save-confirmation');
  return JSON.stringify({
    confirmation: confirmation?.textContent?.includes('Explore Save') ?? false,
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Interactive home import smoke failed: ${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (!payload.confirmation)
    throw new Error(`Unexpected home import smoke result: ${JSON.stringify(payload)}`);
}
async function interactiveEditorSourceSmoke(url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 120 && !document.querySelector('#editor-share'); i += 1)
    await delay(50);
  const shareButton = document.querySelector('#editor-share');
  if (!shareButton) throw new Error('missing editor share button');
  shareButton.click();
  let value = '';
  for (let i = 0; i < 120 && !value; i += 1) {
    await delay(50);
    value = document.querySelector('.editor-dialog .data-exchange-text')?.value ?? '';
  }
  return JSON.stringify({
    hash: location.hash,
    compressed: /\\/import\\/v1#[A-Za-z0-9_-]+$/.test(value),
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Interactive editor source smoke failed: ${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (payload.hash || !payload.compressed)
    throw new Error(`Unexpected editor source result: ${JSON.stringify(payload)}`);
}
async function runBrowserEval(url, script) {
  const profile = createBrowserProfile();
  const child = spawn(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-networking",
      `--user-data-dir=${profile}`,
      "--remote-debugging-pipe",
      "about:blank",
    ],
    {
      env: browserEnvironment,
      stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"],
    },
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", (chunk) => (stdout += String(chunk)));
  child.stderr.on("data", (chunk) => (stderr += String(chunk)));
  const input = child.stdio[3];
  const output = child.stdio[4];
  if (!input || !output) {
    child.kill("SIGKILL");
    removeBrowserProfile(profile);
    return { status: 1, stdout, stderr: "Chromium CDP pipe failed to open" };
  }
  const cdp = createCdpPipe(input, output, child);
  try {
    return await withTimeout(
      (async () => {
        const { targetId } = await cdp.send("Target.createTarget", {
          url: "about:blank",
        });
        const { sessionId } = await cdp.send("Target.attachToTarget", {
          targetId,
          flatten: true,
        });
        await cdp.send("Page.enable", {}, sessionId);
        await cdp.send("Runtime.enable", {}, sessionId);
        await cdp.send("Network.enable", {}, sessionId);
        await cdp.send(
          "Network.setBlockedURLs",
          {
            urls: [
              "https://www.googletagmanager.com/*",
              "https://www.google-analytics.com/*",
            ],
          },
          sessionId,
        );
        await cdp.send(
          "Page.addScriptToEvaluateOnNewDocument",
          {
            source: `
globalThis.__bc5rSmokeErrors = [];
addEventListener("error", (event) => {
  const detail = event.error?.stack ?? event.message ?? "页面运行错误";
  globalThis.__bc5rSmokeErrors.push(String(detail));
});
addEventListener("unhandledrejection", (event) => {
  const detail = event.reason?.stack ?? event.reason ?? "未处理的 Promise 拒绝";
  globalThis.__bc5rSmokeErrors.push(String(detail));
});
`,
          },
          sessionId,
        );
        const navigation = await cdp.send("Page.navigate", { url }, sessionId);
        if (navigation.errorText)
          throw new Error(`Chromium navigation failed: ${navigation.errorText}`);
        await waitForPageReady(cdp, sessionId, url);
        const evaluation = await cdp.send(
          "Runtime.evaluate",
          { expression: script, awaitPromise: true, returnByValue: true },
          sessionId,
        );
        const exception = evaluation.exceptionDetails;
        if (exception)
          throw new Error(exception.text || "browser evaluation failed");
        const value = evaluation.result?.value;
        return {
          status: 0,
          stdout: `${stdout}\n${JSON.stringify(value)}\n`,
          stderr,
          value,
        };
      })(),
      20_000,
      `Chromium timed out while loading ${url}`,
    );
  } catch (error) {
    return {
      status: 1,
      stdout,
      stderr: `${stderr}\n${error instanceof Error ? error.stack : String(error)}`,
    };
  } finally {
    cdp.close();
    child.kill("SIGKILL");
    await waitForBrowserClose(child);
    removeBrowserProfile(profile);
  }
}

async function waitForPageReady(cdp, sessionId, url) {
  const expected = new URL(url);
  const expectedDocumentUrl = `${expected.origin}${expected.pathname}${expected.search}`;
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    try {
      const evaluation = await cdp.send(
        "Runtime.evaluate",
        {
          expression:
            "({ documentUrl: location.origin + location.pathname + location.search, readyState: document.readyState })",
          returnByValue: true,
        },
        sessionId,
      );
      const state = evaluation.result?.value;
      if (
        state?.documentUrl === expectedDocumentUrl &&
        state.readyState === "complete"
      ) return;
    } catch (error) {
      if (!isNavigationContextError(error)) throw error;
    }
    await delay(50);
  }
  throw new Error(`Chromium page did not become ready: ${url}`);
}

function isNavigationContextError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /Execution context was destroyed|Cannot find context|Inspected target navigated|Cannot find default execution context|No frame with given id/i.test(
    message,
  );
}

function withTimeout(task, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createBrowserProfile() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-browser-smoke-"));
}

function removeBrowserProfile(profile) {
  fs.rmSync(profile, { recursive: true, force: true });
}

function waitForBrowserClose(child) {
  if (child.exitCode !== null || child.signalCode !== null)
    return Promise.resolve();
  return new Promise((resolve) => child.once("close", resolve));
}
function createCdpPipe(input, output, child) {
  let nextId = 1;
  let buffer = "";
  let closed = false;
  const pending = new Map();
  const fail = (error) => {
    if (closed) return;
    closed = true;
    const failure = error instanceof Error ? error : new Error(String(error));
    for (const request of pending.values()) request.reject(failure);
    pending.clear();
  };
  child.once("error", fail);
  child.once("exit", (code, signal) => {
    fail(
      new Error(
        `Chromium exited before CDP completed (${signal ?? `code ${code ?? "unknown"}`})`,
      ),
    );
  });
  input.once("error", fail);
  output.once("error", fail);
  output.once("close", () => fail(new Error("Chromium CDP pipe closed")));
  output.on("data", (chunk) => {
    if (closed) return;
    buffer += chunk.toString();
    let boundary = buffer.indexOf("\0");
    while (boundary >= 0) {
      const packet = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);
      if (packet) {
        try {
          const message = JSON.parse(packet);
          const request = message.id ? pending.get(message.id) : undefined;
          if (request) {
            pending.delete(message.id);
            if (message.error) request.reject(new Error(message.error.message));
            else request.resolve(message.result ?? {});
          }
        } catch (error) {
          fail(error);
          return;
        }
      }
      boundary = buffer.indexOf("\0");
    }
  });
  return {
    send(method, params = {}, sessionId) {
      if (closed) return Promise.reject(new Error("Chromium CDP pipe is closed"));
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        try {
          input.write(`${JSON.stringify({ id, method, params, sessionId })}\0`);
        } catch (error) {
          pending.delete(id);
          reject(error);
        }
      });
    },
    close() {
      if (!closed) {
        input.end();
        fail(new Error("Chromium CDP pipe closed"));
      }
    },
  };
}
function lastJsonLine(value) {
  const lines = value.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed === "string") return JSON.parse(parsed);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  throw new Error(`No JSON payload in browser output: ${compact(value)}`);
}
