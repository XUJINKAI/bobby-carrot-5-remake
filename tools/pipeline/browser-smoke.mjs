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
    "editor-surface-panel",
  ]);
  await smoke(`${origin}/edit#map=novoban-pushbox/01`, ["bobby-editor"]);
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
        "--dump-dom",
        url,
      ],
      {
        env: browserEnvironment,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "",
      stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });
}
function compact(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 16000);
}
function findBrowser() {
  const explicit = process.env.BROWSER_PATH;
  if (explicit && isExecutable(explicit)) return explicit;
  const commands = [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ];
  for (const command of commands) {
    const probe = spawnSync("which", [command], { encoding: "utf8" });
    const candidate = probe.status === 0 ? probe.stdout.trim() : "";
    if (candidate && isExecutable(candidate)) return candidate;
  }
  return null;
}
function isExecutable(candidate) {
  try {
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function interactiveDataExchangeSmoke(homeUrl) {
  const script = `
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    window.addEventListener("load", async () => {
      for (let i = 0; i < 100; i += 1) {
        const button = document.querySelector('[data-home-import]');
        if (button) {
          button.click();
          await sleep(50);
          const dialog = document.querySelector('dialog[open]');
          const area = dialog?.querySelector('textarea');
          if (!area) throw new Error("Data Exchange textarea did not mount");
          area.value = "{}";
          area.dispatchEvent(new Event("input", { bubbles: true }));
          await sleep(20);
          const apply = [...dialog.querySelectorAll('button')].find((item) => item.textContent?.includes("打开"));
          if (!apply) throw new Error("Data Exchange apply button missing");
          console.log("BC5R_INTERACTIVE_EXCHANGE_OK");
          return;
        }
        await sleep(20);
      }
      throw new Error("Data Exchange trigger did not mount");
    });
  `;
  const result = await runInteractiveBrowser(homeUrl, script);
  if (!result.stdout.includes("BC5R_INTERACTIVE_EXCHANGE_OK"))
    throw new Error(`Data Exchange interactive smoke failed\n${compact(result.stderr)}`);
}

async function interactiveFilterSmoke(url) {
  const script = `
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    window.addEventListener("load", async () => {
      for (let i = 0; i < 100; i += 1) {
        const trigger = document.querySelector('[data-filter-trigger="carrots"]');
        if (trigger) {
          trigger.click();
          await sleep(50);
          const popup = document.querySelector('.level-filter-popup');
          if (!popup) throw new Error("Carrot filter popup did not mount");
          console.log("BC5R_INTERACTIVE_FILTER_OK");
          return;
        }
        await sleep(20);
      }
      throw new Error("Carrot filter trigger did not mount");
    });
  `;
  const result = await runInteractiveBrowser(url, script);
  if (!result.stdout.includes("BC5R_INTERACTIVE_FILTER_OK"))
    throw new Error(`Explore filter interactive smoke failed\n${compact(result.stderr)}`);
}

function runInteractiveBrowser(url, script) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        `--virtual-time-budget=5000`,
        `--run-all-compositor-stages-before-draw`,
        `--user-data-dir=${path.join(root, ".tmp-browser-smoke")}`,
        `--remote-debugging-port=0`,
        `data:text/html,<script>location.href=${JSON.stringify(url)};<\/script><script>${script}<\/script>`,
      ],
      { env: browserEnvironment, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "",
      stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });
}
