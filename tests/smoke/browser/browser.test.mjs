import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { BC5R_GAME_ID } from "../../../model/dist/index.js";
import {
  assertMapStatusSmoke,
  mapStatusSmokeScript,
} from "./cases/map-status.mjs";
import { runEmbedHudSmoke } from "./cases/embed-hud.mjs";
import { runHomePrerenderSmoke } from "./cases/home-prerender.mjs";
import {
  runStandaloneEmbedSmoke,
  startStandaloneEmbedHost,
} from "./cases/embed-standalone.mjs";
import {
  runEditorPlaySmoke,
  runEditorSourceSmoke,
} from "./cases/editor.mjs";
import { runSourceBrowserRegression } from "./cases/source-regression.mjs";
import { root } from "../../../tools/lib/fs.mjs";
import { serveDistRequest } from "../../../tools/lib/static-server.mjs";
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
  if (/^\/(?:assets|embed\/v1)\//.test(request.url ?? ""))
    response.setHeader("access-control-allow-origin", "*");
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
let browserRuntime = null;
let standaloneHost = null;
try {
  browserRuntime = startBrowserRuntime(browser);
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Failed to determine smoke-test server port");
  const origin = `http://127.0.0.1:${address.port}`;
  const homeContext = await createBrowserContext(browserRuntime.cdp);
  try {
    await runHomePrerenderSmoke(homeContext.cdp, origin);
  } finally {
    await homeContext.dispose();
  }
  await smoke(
    `${origin}/`,
    [
      "data-shell",
      'class="home-mode-panel"',
      'class="home-sky-brand"',
      'class="home-demo-screen-control"',
      'href="https://github.com/XUJINKAI/bobby-carrot-5-remake"',
      "data-home-import",
    ],
    ['class="adventure-menu"'],
  );
  await interactiveDataExchangeSmoke(`${origin}/`);
  const mapPayload = exchangePayload(
    fs.readFileSync(
      path.join(root, "tests/fixtures/smoke/mechanics-smoke.json"),
      "utf8",
    ),
  );
  const embedUrl = `${origin}/embed#${mapPayload}`;
  await smoke(embedUrl, [
    'class="embed-page"',
    'data-embed-api="ready"',
    'class="code-block"',
    "English",
    "Modern",
    'class="keyboard-select"',
  ]);
  await runEmbedHudSmoke(runBrowserEval, embedUrl, lastJsonLine);
  await expectStatus(`${origin}/embed/v1/bc5r.js`, 200, "text/javascript");
  standaloneHost = await startStandaloneEmbedHost(
    `${origin}/embed/v1/bc5r.js`,
    fs.readFileSync(
      path.join(root, "tests/fixtures/smoke/mechanics-smoke.json"),
      "utf8",
    ),
  );
  await runStandaloneEmbedSmoke(runBrowserEval, standaloneHost.url, lastJsonLine);
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
      "1 · FAIRY MAGIC",
      "Special Scenes",
      "Dreamland Reward",
      'href="/explore/play/original/campaign-intro"',
    ],
    ['class="adventure-menu"', 'class="recording-indicator"'],
  );
  await exploreDifficultySmoke(`${origin}/explore`);
  await interactiveFilterSmoke(`${origin}/explore`);
  await smoke(`${origin}/explore/novoban`, [
    'class="explore-tabs"',
    'class="explore-ungrouped-maps"',
    'data-card-size="medium"',
    "Novoban",
    "01 · Be ban 10",
  ]);
  await smoke(
    `${origin}/explore/loma`,
    [
      'class="explore-tabs"',
      'class="chapter-card"',
      'class="chapter-name"',
      'data-card-size="small"',
      "LOMA",
      'href="/explore/play/loma/01-01"',
    ],
    ['class="chapter-id"', 'class="chapter-separator"'],
  );
  await smoke(
    `${origin}/explore/engine-lab`,
    [
      'class="explore-ungrouped-maps"',
      'data-card-size="medium"',
      'href="/explore/play/engine-lab/00-intro"',
      'href="/explore/play/engine-lab/01-control2"',
    ],
    ['class="chapter-card"', 'class="chapter-separator"'],
  );
  await smoke(`${origin}/explore/robo2`, [
    'class="explore-tabs"',
    'class="explore-ungrouped-maps"',
    'data-card-size="medium"',
    "Robo 2",
    "01 · The beggining!",
    "25 · Saving Eny!",
    'href="/explore/play/robo2/01"',
    'href="/explore/play/robo2/25"',
  ]);
  await smoke(`${origin}/explore/play/loma/01-01`, [
    'class="game-page"',
    'id="game"',
    'id="map-status"',
    'data-icon="map-details"',
    'class="shell-indicator-button tone-muted"',
    "01-01",
  ]);
  await interactiveMapStatusSmoke(
    `${origin}/explore/play/loma/01-01`,
    {
      icon: "map-details",
      tone: "muted",
      details: {
        verification: ["未验证", "Not verified"],
        "map-id": "loma/01-01",
        "map-name": "01-01",
        author: "Aymeric du Peloux",
      },
    },
  );
  await smoke(`${origin}/explore/play/original/1-1`, [
    'class="game-page"',
    'id="game"',
    'id="replay-record"',
    "data-replay-panel",
    'id="undo"',
    'id="redo"',
    'id="previous-level"',
    'id="next-level"',
    'class="shell-topbar-left"',
    'class="shell-topbar-center"',
    'class="shell-topbar-right"',
    'id="map-status"',
    'data-icon="map-status"',
    'class="shell-indicator-button tone-success"',
  ]);
  await smoke(
    `${origin}/explore/play/original/unlisted-smoke`,
    [
      'class="game-page"',
      'id="game"',
    ],
  );
  await smoke(
    `${origin}/explore/play/standalone-smoke/standalone`,
    [
      'class="game-page"',
      'id="game"',
    ],
  );
  await interactiveMapStatusSmoke(`${origin}/explore/play/original/1-1`, {
    icon: "map-status",
    tone: "success",
    details: {
      verification: ["已验证可通关", "Verified completable"],
      "map-id": "original/1-1",
      "map-name": "1",
    },
  });
  await smoke(`${origin}/explore/play/novoban/01`, [
    'class="game-page"',
    'id="game"',
    "01 · Be ban 10",
  ]);
  await smoke(`${origin}/explore/play/robo2/01`, [
    'class="game-page"',
    'id="game"',
    "01 · The beggining!",
  ]);
  await smoke(`${origin}/adventure`, [
    "adventure-viewport-auto",
    'class="adventure-menu"',
    'class="shell-product-name"',
    'class="shell-context-name"',
    'class="adventure-resume-level"',
  ]);
  await smoke(`${origin}/adventure/chapters`, [
    'class="adventure-chapters"',
    'class="chapter-stars"',
    'class="shell-context-name"',
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
      'class="shell-product-name"',
      'id="map-status"',
      'data-icon="map-status"',
      'class="shell-indicator-button tone-success"',
    ],
    ['id="undo"', 'id="replay-record"', "data-replay-panel"],
  );
  await smoke(`${origin}/edit`, [
    "bobby-editor",
    'id="editor-play"',
    'id="editor-share"',
    'data-palette-type="egg"',
  ]);
  await runEditorSourceSmoke(
    runBrowserEval,
    lastJsonLine,
    `${origin}/edit#map=engine-lab/00-intro`,
    { type: "all", conditions: [{ type: "exit" }] },
  );
  await runEditorPlaySmoke(
    runBrowserEval,
    lastJsonLine,
    `${origin}/edit#map=engine-lab/00-intro`,
  );
  await smoke(`${origin}/edit/test`, [
    "data-game-stage",
    'id="editor-game"',
    'id="map-status"',
    "editor/draft",
  ]);
  const { createAdventureSave, serializeAdventureSave } = await import(
    "../../../adventure/dist/index.js"
  );
  const profilePayload = exchangePayload(
    serializeAdventureSave(createAdventureSave()),
  );
  const importedMapUrl = `${origin}/import/v1#${mapPayload}`;
  await smoke(importedMapUrl, [
    'class="game-page"',
    'class="shell-context-name"',
    'id="game"',
    'id="map-status"',
    'data-icon="map-details"',
  ]);
  await interactiveMapStatusSmoke(importedMapUrl, {
    icon: "map-details",
    tone: "muted",
    details: {
      verification: ["未验证", "Not verified"],
      "map-id": "imported/shared-map",
      "map-name": "Engine Mechanics Smoke Map",
      author: "bc5r",
      note: "Editor → Engine / Original JAR 回归测试夹具；不是正式谜题关。",
    },
  });
  await smoke(`${origin}/import/v1#${profilePayload}`, [
    'class="import-page"',
    'class="shell-context-name"',
    "Adventure Save",
    'class="import-save-actions"',
  ]);
  const explorePayload = exchangePayload(JSON.stringify({
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: "explore/original",
    completedMaps: [],
  }));
  await smoke(`${origin}/import/v1#${explorePayload}`, [
    'class="import-page"',
    "Explore Save",
    'class="import-save-actions"',
  ]);
  await smoke(`${origin}/import/v1#${exchangePayload("{}")}`, [
    'class="import-page"',
    'class="import-card"',
  ]);
  await smoke(`${origin}/import/v1#INVALID!`, [
    'class="import-page"',
    "Invalid Base64 data payload",
  ]);
  await expectStatus(`${origin}/robots.txt`, 200, "text/plain");
  await expectStatus(`${origin}/sitemap.xml`, 200, "application/xml");
  await verifyRouteMigration(
    `${origin}/explore/loma-pushbox?source=legacy#tabs`,
    "/explore/loma",
    ".explore-tabs",
  );
  await verifyRouteMigration(
    `${origin}/explore/play/novoban-pushbox/01?source=legacy#game`,
    "/explore/play/novoban/01",
    ".game-page",
  );
  await expectStatus(`${origin}/edit/novoban/01`, 404, "text/plain");
  await expectStatus(`${origin}/explore/original`, 404, "text/plain");
  await expectStatus(`${origin}/this-route-does-not-exist`, 404, "text/plain");
  await expectStatus(`${origin}/assets/does-not-exist.png`, 404, "text/plain");
  await expectStatus(`${origin}/engine/missing.js`, 404, "text/plain");
  await expectStatus(`${origin}/model/missing`, 404, "text/plain");
  await expectStatus(`${origin}/adventure/missing.js`, 404, "text/plain");
  // Source regression 原本就在同一浏览器环境内连续验证状态流转，因此整组共用
  // 一个隔离 context；production smoke 的每次 runBrowserEval 则各自创建 context。
  const sourceContext = await createBrowserContext(browserRuntime.cdp);
  try {
    await runSourceBrowserRegression(sourceContext.cdp);
  } finally {
    await sourceContext.dispose();
  }
  console.log(
    `browser smoke: OK — ${path.basename(browser)} loaded generated SPA route shells while unknown routes and missing static resources returned 404`,
  );
} finally {
  await standaloneHost?.close();
  await browserRuntime?.close();
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
async function verifyRouteMigration(navigateUrl, expectedPathname, readySelector) {
  const readyUrl = new URL(navigateUrl);
  readyUrl.pathname = expectedPathname;
  const result = await runBrowserEval(
    navigateUrl,
    `(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 120; i += 1) {
        if (
          location.pathname === ${JSON.stringify(expectedPathname)} &&
          location.search === "?source=legacy" &&
          location.hash === ${JSON.stringify(readyUrl.hash)} &&
          document.querySelector(${JSON.stringify(readySelector)})
        ) {
          return JSON.stringify({
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          });
        }
        await delay(50);
      }
      return JSON.stringify({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      });
    })()`,
    readyUrl.href,
  );
  if (result.status !== 0)
    throw new Error(`历史路由迁移检查失败：${result.stderr || result.stdout}`);
  const actual = lastJsonLine(result.stdout);
  if (
    actual.pathname !== expectedPathname ||
    actual.search !== "?source=legacy" ||
    actual.hash !== readyUrl.hash
  ) {
    throw new Error(`历史路由迁移结果异常：${JSON.stringify(actual)}`);
  }
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
async function exploreDifficultySmoke(url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let star = null;
  for (let i = 0; i < 120 && !star; i += 1) {
    await delay(50);
    star = document.querySelector('.chapter-stars .app-icon');
  }
  if (!star) throw new Error('missing Explore difficulty star');
  return JSON.stringify({ color: getComputedStyle(star).color });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Explore 难度星级检查失败：${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (payload.color !== "rgb(247, 212, 95)")
    throw new Error(`Explore 难度星级颜色异常：${JSON.stringify(payload)}`);
}
async function interactiveMapStatusSmoke(url, expected) {
  const result = await runBrowserEval(url, mapStatusSmokeScript);
  if (result.status !== 0)
    throw new Error(`地图状态 tooltip 检查失败：${result.stderr || result.stdout}`);
  assertMapStatusSmoke(lastJsonLine(result.stdout), expected);
}
async function interactiveDataExchangeSmoke(url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 120 && !document.querySelector('[data-home-import]'); i += 1)
    await delay(50);
  const importButton = document.querySelector('[data-home-import]');
  if (!importButton) throw new Error('missing import button');
  const screenControl = document.querySelector('.home-demo-screen-control');
  let joystick = null;
  for (let i = 0; i < 120 && !joystick; i += 1) {
    await delay(50);
    joystick = document.querySelector('.engine-screen-joystick-layer');
  }
  if (!screenControl || !joystick) throw new Error('missing home demo joystick');
  if (joystick.hidden) {
    screenControl.click();
    for (let i = 0; i < 120 && joystick.hidden; i += 1) await delay(50);
  }
  importButton.click();
  const source = {
    game: ${JSON.stringify(BC5R_GAME_ID)},
    schemaVersion: 1,
    scope: 'explore/original',
    completedMaps: ['1-1'],
    lastMap: '1-1',
  };
  let textarea = null;
  for (let i = 0; i < 120 && !textarea; i += 1) {
    await delay(50);
    textarea = document.querySelector('.home-import-dialog textarea');
  }
  if (!textarea) throw new Error('missing import textarea');
  const activation = document.querySelector('.engine-screen-joystick-activation');
  if (!activation) throw new Error('missing joystick activation area');
  // 窄视口中的 Demo 位于首屏下方，覆盖检查必须使用可见区域内的摇杆坐标。
  activation.scrollIntoView({ block: 'center', behavior: 'instant' });
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const rect = activation.getBoundingClientRect();
  const hit = document.elementFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  );
  const dialogCoversJoystick = Boolean(hit?.closest('.home-import-dialog-layer'));
  textarea.value = JSON.stringify(source);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  const open = document.querySelector(
    '.home-import-dialog [data-exchange-action="importText"]',
  );
  if (!open) throw new Error('missing import-text button');
  open.click();
  for (let i = 0; i < 120 && !document.querySelector('.import-save-confirmation'); i += 1)
    await delay(50);
  const confirmation = document.querySelector('.import-save-confirmation');
  return JSON.stringify({
    confirmation: confirmation?.textContent?.includes('Explore Save') ?? false,
    dialogCoversJoystick,
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0)
    throw new Error(`Interactive home import smoke failed: ${result.stderr || result.stdout}`);
  const payload = lastJsonLine(result.stdout);
  if (!payload.confirmation || !payload.dialogCoversJoystick)
    throw new Error(`Unexpected home import smoke result: ${JSON.stringify(payload)}`);
}

async function runBrowserEval(navigateUrl, script, readyUrl = navigateUrl) {
  if (!browserRuntime)
    return { status: 1, stdout: "", stderr: "Chromium runtime 未启动" };
  let context = null;
  try {
    return await withTimeout(
      (async () => {
        context = await createBrowserContext(browserRuntime.cdp);
        const { cdp } = context;
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
        const navigation = await cdp.send(
          "Page.navigate",
          { url: navigateUrl },
          sessionId,
        );
        if (navigation.errorText)
          throw new Error(`Chromium navigation failed: ${navigation.errorText}`);
        await waitForPageReady(cdp, sessionId, readyUrl);
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
          stdout: `${browserRuntime.stdout()}\n${JSON.stringify(value)}\n`,
          stderr: browserRuntime.stderr(),
          value,
        };
      })(),
      40_000,
      `Chromium timed out while loading ${navigateUrl} (ready URL ${readyUrl})`,
    );
  } catch (error) {
    return {
      status: 1,
      stdout: browserRuntime.stdout(),
      stderr: `${browserRuntime.stderr()}\n${error instanceof Error ? error.stack : String(error)}`,
    };
  } finally {
    await context?.dispose().catch(() => {});
  }
}

async function createBrowserContext(cdp) {
  const { browserContextId } = await cdp.send("Target.createBrowserContext");
  const contextCdp = {
    send(method, params = {}, sessionId) {
      const contextParams = method === "Target.createTarget"
        ? { ...params, browserContextId }
        : params;
      return cdp.send(method, contextParams, sessionId);
    },
    evaluate(sessionId, expression) {
      return cdp.evaluate(sessionId, expression);
    },
  };
  return {
    cdp: contextCdp,
    dispose() {
      return cdp.send("Target.disposeBrowserContext", { browserContextId });
    },
  };
}

function startBrowserRuntime(browserPath) {
  const profile = createBrowserProfile();
  const child = spawn(
    browserPath,
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
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => (stdout += String(chunk)));
  child.stderr.on("data", (chunk) => (stderr += String(chunk)));
  const input = child.stdio[3];
  const output = child.stdio[4];
  if (!input || !output) {
    child.kill("SIGKILL");
    removeBrowserProfile(profile);
    throw new Error("Chromium CDP pipe failed to open");
  }
  const cdp = createCdpPipe(input, output, child);
  return {
    cdp,
    stdout: () => stdout,
    stderr: () => stderr,
    async close() {
      cdp.close();
      child.kill("SIGKILL");
      await waitForBrowserClose(child);
      removeBrowserProfile(profile);
    },
  };
}

async function waitForPageReady(cdp, sessionId, readyUrl) {
  const expected = new URL(readyUrl);
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
  throw new Error(`Chromium page did not become ready: ${readyUrl}`);
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
