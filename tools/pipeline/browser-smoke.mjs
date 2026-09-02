import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
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
const server = http.createServer((request, response) =>
  serveDistRequest(webRoot, request, response),
);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
try {
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Failed to determine smoke-test server port");
  const origin = `http://127.0.0.1:${address.port}`;
  await smoke(`${origin}/`, [
    "data-shell",
    'class="home-mode-panel"',
    'class="home-sky-brand"',
  ]);
  await interactiveDataExchangeSmoke(`${origin}/`);
  await smoke(`${origin}/embed`, ['class="embed-page"', "BC5R Embed v1"]);
  await expectStatus(`${origin}/embed/v1/bc5r.js`, 200, "text/javascript");
  await smoke(
    `${origin}/explore`,
    [
      'class="explore-tabs"',
      'class="level-browser-head"',
      'class="level-filter-shell"',
      'data-filter-trigger="carrots"',
      'data-filter-trigger="mechanics"',
      'data-card-size="small"',
    ],
    ["进入冒险模式"],
  );
  await interactiveFilterSmoke(`${origin}/explore`);
  await smoke(`${origin}/explore/novoban-pushbox`, [
    'class="explore-tabs"',
    'class="explore-custom-collection"',
    'data-card-size="medium"',
    "Novoban",
    "01 · Be ban 10",
  ]);
  await smoke(`${origin}/explore/loma-pushbox`, [
    'class="explore-tabs"',
    'class="chapter-card"',
    'data-card-size="small"',
    "LOMA",
    "Pattern",
    'href="/explore/play/loma-pushbox/01-01"',
  ]);
  await smoke(`${origin}/explore/engine-lab`, [
    'class="explore-custom-collection"',
    'data-card-size="big"',
    "Portal Lab",
    "Maximum Moves Lab",
  ]);
  await smoke(`${origin}/explore/play/engine-lab/portal`, [
    'class="game-page"',
    'id="game"',
    "Portal Lab",
  ]);
  await smoke(`${origin}/explore/play/loma-pushbox/01-01`, [
    'class="game-page"',
    'id="game"',
    "01-01",
  ]);
  await smoke(`${origin}/explore/play/original/1-1`, [
    'class="game-page"',
    'id="game"',
    'id="undo"',
    'id="redo"',
    'class="shell-topbar-left"',
    'class="shell-topbar-center"',
    'class="shell-topbar-right"',
  ]);
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
    ["original-adventure-game", 'id="game"'],
    ['id="undo"'],
  );
  await smoke(`${origin}/edit`, [
    "bobby-editor",
    'id="editor-play"',
    'id="editor-share"',
    'class="editor-palette"',
  ]);
  await smoke(`${origin}/edit/novoban-pushbox/01`, ["bobby-editor"]);
  const mapPayload = exchangePayload(
    fs.readFileSync(
      path.join(root, "custom-maps/test/mechanics-smoke.json"),
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
    "Adventure Profile",
    "导入并覆盖",
  ]);
  await smoke(`${origin}/import/v1#${exchangePayload("{}")}`, [
    'class="import-page"',
    "无法识别这段 BC5R 数据",
  ]);
  await smoke(`${origin}/import/v1#INVALID`, [
    'class="import-page"',
    "BC5R1",
  ]);
  await expectStatus(`${origin}/assets/does-not-exist.png`, 404, "text/plain");
  await expectStatus(`${origin}/engine/missing.js`, 404, "text/plain");
  await expectStatus(`${origin}/model/missing`, 404, "text/plain");
  await expectStatus(`${origin}/adventure/missing.js`, 404, "text/plain");
  console.log(
    `browser smoke: OK — ${path.basename(browser)} loaded Explore/Adventure SPA routes while missing static resources returned 404`,
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
  if (body.includes('<div id="app">'))
    throw new Error(
      `Missing static resource ${url} incorrectly received SPA HTML`,
    );
}
async function smoke(url, expected, forbidden = []) {
  const result = await runBrowser(url);
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
function runBrowser(url) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--virtual-time-budget=10000",
        "--dump-dom",
        url,
      ],
      { env: browserEnvironment, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "",
      stderr = "";
    const max = 8 * 1024 * 1024,
      timer = setTimeout(() => child.kill("SIGKILL"), 15_000);
    child.stdout.on("data", (chunk) => {
      if (stdout.length < max) stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      if (stderr.length < max) stderr += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
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
  for (let i = 0; i < 120 && !find('[data-filter-trigger="carrots"]'); i += 1)
    await delay(50);
  const trigger = find('[data-filter-trigger="carrots"]');
  if (!trigger) throw new Error('missing carrot trigger');
  trigger.click();
  await delay(80);
  const option = find('[data-filter-option="carrots:1"]');
  if (!option) throw new Error('missing carrot filter option');
  option.click();
  await delay(80);
  return JSON.stringify({
    selected: trigger.getAttribute('data-selected'),
    active: option.classList.contains('active'),
    cards: document.querySelectorAll('.level-card').length,
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Interactive filter smoke failed: ${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (payload.selected !== "1" || !payload.active || payload.cards <= 0)
    throw new Error(`Unexpected filter smoke result: ${JSON.stringify(payload)}`);
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
  await delay(80);
  const importDialog = document.querySelector('.home-import-dialog');
  if (!importDialog) throw new Error('missing import dialog');
  return JSON.stringify({ import: Boolean(importDialog) });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Interactive home import smoke failed: ${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (!payload.import)
    throw new Error(`Unexpected home import smoke result: ${JSON.stringify(payload)}`);
}
async function runBrowserEval(url, script) {
  const port = 9222 + Math.floor(Math.random() * 1000);
  const child = spawn(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-networking",
      `--remote-debugging-port=${port}`,
      "about:blank",
    ],
    { env: browserEnvironment, stdio: ["ignore", "pipe", "pipe"] },
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", (chunk) => (stdout += String(chunk)));
  child.stderr.on("data", (chunk) => (stderr += String(chunk)));
  try {
    const endpoint = await waitForDebugEndpoint(port);
    const page = await fetch(`${endpoint}/json/new?about:blank`, {
      method: "PUT",
    }).then((response) => response.json());
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    let id = 0;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      const deferred = pending.get(message.id);
      if (!deferred) return;
      pending.delete(message.id);
      deferred.resolve(message);
    });
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const requestId = ++id;
        pending.set(requestId, { resolve, reject });
        ws.send(JSON.stringify({ id: requestId, method, params }));
      });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", { url });
    await new Promise((resolve) => setTimeout(resolve, 700));
    const evaluation = await send("Runtime.evaluate", {
      expression: script,
      awaitPromise: true,
      returnByValue: true,
    });
    ws.close();
    const exception = evaluation.result?.exceptionDetails;
    if (exception) throw new Error(exception.text || "browser evaluation failed");
    const value = evaluation.result?.result?.value;
    return { status: 0, stdout: `${stdout}\n${JSON.stringify(value)}\n`, stderr };
  } catch (error) {
    return {
      status: 1,
      stdout,
      stderr: `${stderr}\n${error instanceof Error ? error.stack : String(error)}`,
    };
  } finally {
    child.kill("SIGKILL");
  }
}
async function waitForDebugEndpoint(port) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) =>
        response.json(),
      );
      if (version.webSocketDebuggerUrl) return `http://127.0.0.1:${port}`;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Chrome DevTools endpoint did not start");
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
