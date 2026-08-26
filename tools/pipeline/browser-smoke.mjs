import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { root } from "../lib/fs.mjs";
import { serveDistRequest } from "../lib/static-server.mjs";
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
  await smoke(
    `${origin}/explore`,
    [
      'class="explore-tabs"',
      'class="level-browser-head"',
      'class="level-filter-shell"',
      'data-filter-trigger="carrots"',
      'data-filter-trigger="mechanics"',
    ],
    ["进入冒险模式"],
  );
  await interactiveFilterSmoke(`${origin}/explore`);
  await smoke(`${origin}/explore/pushbox`, [
    'class="explore-tabs"',
    'class="explore-custom-collection"',
    "Pushbox 1",
  ]);
  await smoke(`${origin}/explore/test`, [
    'class="explore-custom-collection"',
    "Portal Lab",
    "Maximum Moves Lab",
  ]);
  await smoke(`${origin}/explore/play/test/test-portal`, [
    'class="game-page"',
    'id="game"',
    "Portal Lab",
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
  await smoke(`${origin}/explore/play/pushbox/box-01`, [
    'class="game-page"',
    'id="game"',
    "Pushbox 1",
  ]);
  await smoke(`${origin}/adventure`, [
    'class="adventure-phone"',
    'class="adventure-menu"',
  ]);
  await smoke(`${origin}/adventure/chapters`, [
    'class="adventure-chapters"',
    'class="chapter-stars"',
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
    'class="bobby-editor"',
    'id="editor-play"',
    'id="editor-share"',
    'class="editor-palette"',
  ]);
  await smoke(`${origin}/edit/pushbox/box-01`, [
    'class="bobby-editor"',
    "Pushbox 1 · 副本",
  ]);
  const mapPayload = exchangePayload(
    fs.readFileSync(path.join(root, "editor/examples/mechanics-smoke.json"), "utf8"),
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
        `Browser mounted forbidden content for ${url}; found ${fragment}\n${compact(result.stdout)}`,
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
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "",
      stderr = "";
    const max = 8 * 1024 * 1024,
      append = (current, chunk) => {
        const next = current + chunk.toString();
        if (Buffer.byteLength(next) > max)
          throw new Error("Browser smoke output exceeded 8 MiB");
        return next;
      };
    child.stdout.on("data", (chunk) => {
      try {
        stdout = append(stdout, chunk);
      } catch (error) {
        child.kill("SIGKILL");
        reject(error);
      }
    });
    child.stderr.on("data", (chunk) => {
      try {
        stderr = append(stderr, chunk);
      } catch (error) {
        child.kill("SIGKILL");
        reject(error);
      }
    });
    child.once("error", reject);
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Browser smoke timed out for ${url}`));
    }, 30000);
    child.once("close", (status) => {
      clearTimeout(timeout);
      resolve({ status, stdout, stderr });
    });
  });
}

async function interactiveFilterSmoke(url) {
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
    { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] },
  );
  const input = child.stdio[3],
    output = child.stdio[4];
  if (!input || !output) throw new Error("Chromium CDP pipe failed to open");
  const cdp = createCdpPipe(input, output);
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url });
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    await waitFor(async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('[data-filter-trigger=\"carrots\"]')",
        ),
      ),
    );
    const before = await cdp.evaluate(
      sessionId,
      "document.querySelectorAll('.chapter-level:not(.filter-hidden)').length",
    );
    await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-filter-trigger=\"carrots\"]').click(); document.querySelector('[data-filter-group=\"carrots\"][data-filter-option=\"0\"]').click(); true",
    );
    await waitFor(async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('[data-filter-option=\"0\"]')?.classList.contains('selected')",
        ),
      ),
    );
    const filtered = await cdp.evaluate(
        sessionId,
        "document.querySelectorAll('.chapter-level:not(.filter-hidden)').length",
      ),
      hidden = await cdp.evaluate(
        sessionId,
        "document.querySelectorAll('.chapter-level.filter-hidden').length",
      );
    if (!(filtered > 0 && hidden > 0 && filtered < before))
      throw new Error(
        `Explore carrot filter produced invalid counts: before=${before}, visible=${filtered}, hidden=${hidden}`,
      );
    await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-filter-clear]').click(); true",
    );
    await waitFor(async () =>
      (await cdp.evaluate(
        sessionId,
        "document.querySelectorAll('.chapter-level.filter-hidden').length",
      )) === 0,
    );
    const restored = await cdp.evaluate(
      sessionId,
      "document.querySelectorAll('.chapter-level:not(.filter-hidden)').length",
    );
    if (restored !== before)
      throw new Error(
        `Explore filter clear did not restore all levels: before=${before}, restored=${restored}`,
      );
  } finally {
    cdp.close();
    child.kill("SIGKILL");
  }
}

async function interactiveDataExchangeSmoke(url) {
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
    { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] },
  );
  const input = child.stdio[3], output = child.stdio[4];
  if (!input || !output) throw new Error("Chromium CDP pipe failed to open");
  const cdp = createCdpPipe(input, output);
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url });
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    await waitFor(async () => Boolean(await cdp.evaluate(sessionId, "document.querySelector('[data-home-import]')")));
    await cdp.evaluate(sessionId, "document.querySelector('[data-home-import]').click(); true");
    await waitFor(async () => Boolean(await cdp.evaluate(sessionId, "document.querySelector('.home-import-dialog[role=dialog]')")));
    const selected = await cdp.evaluate(
      sessionId,
      "(() => { const area = document.querySelector('.data-exchange-text'); area.value = 'editable'; area.focus(); return area.selectionStart === 0 && area.selectionEnd === area.value.length; })()",
    );
    if (!selected) throw new Error("Data Exchange TextBox did not select all on focus");
    const edited = await cdp.evaluate(
      sessionId,
      "(() => { const area = document.querySelector('.data-exchange-text'); area.setRangeText('changed', 0, area.value.length, 'end'); area.dispatchEvent(new Event('input', { bubbles: true })); return area.value; })()",
    );
    if (edited !== "changed") throw new Error("Data Exchange TextBox is not editable after selection");
  } finally {
    cdp.close();
    child.kill("SIGKILL");
  }
}

function createCdpPipe(input, output) {
  let nextId = 1,
    buffer = "";
  const pending = new Map();
  output.on("data", (chunk) => {
    buffer += chunk.toString();
    let boundary = buffer.indexOf("\0");
    while (boundary >= 0) {
      const packet = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);
      if (packet) {
        const message = JSON.parse(packet),
          request = message.id ? pending.get(message.id) : undefined;
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
  throw new Error("Browser interaction timed out");
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
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        continue;
      }
    }
    const probe = spawnSync(candidate, ["--version"], {
      encoding: "utf8",
      timeout: 5000,
    });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}
function compact(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 1200);
}
