import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { root } from "./util.mjs";
import { serveDistRequest } from "./static-server.mjs";
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
    'class="home-root"',
    'class="home-mode-panel"',
  ]);
  await smoke(`${origin}/levels`, [
    'class="level-browser-head"',
    'class="level-filter-shell"',
    'data-filter-trigger="difficulty"',
    'data-filter-trigger="mechanics"',
  ]);
  await smoke(`${origin}/play/1-1`, [
    'class="game-page"',
    'id="game"',
    'id="undo"',
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
    'class="editor-palette"',
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
function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
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
