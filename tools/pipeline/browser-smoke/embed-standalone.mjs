import http from "node:http";

export async function startStandaloneEmbedHost(scriptUrl, mapText) {
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <title>BC5R standalone embed smoke</title>
  </head>
  <body style="margin:0;background:#fff">
    <div id="bc5r" style="width:640px;height:520px"></div>
    <script>
      window.BC5R = { queue: [] };
      BC5R.queue.push({
        target: "#bc5r",
        map: ${JSON.stringify(mapText)},
        audio: false,
        input: { joystick: false }
      });
    </script>
    <script async src=${JSON.stringify(scriptUrl)}></script>
  </body>
</html>`;
  const server = http.createServer((request, response) => {
    if (request.url !== "/") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(html);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("无法确定 standalone Embed 宿主端口");
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export const standaloneEmbedSmokeScript = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let host = null;
  for (let i = 0; i < 120; i += 1) {
    host = document.querySelector('#bc5r');
    const status = host?.shadowRoot?.querySelector('.bc5r-status');
    const hud = host?.shadowRoot?.querySelector('.engine-gameplay-hud');
    if (globalThis.BC5R?.mount && status?.hidden && hud) break;
    await delay(50);
  }
  const shadow = host?.shadowRoot;
  const hud = shadow?.querySelector('.engine-gameplay-hud');
  const value = shadow?.querySelector('.engine-gameplay-hud-value');
  if (!hud || !value) throw new Error('standalone Embed did not become ready');
  await document.fonts.load('36px "BC5R Jersey 10"', '0123456789');
  await document.fonts.ready;
  const jerseyFaces = [...document.fonts]
    .filter((face) => face.family.replaceAll('"', '') === 'BC5R Jersey 10')
    .map((face) => ({ family: face.family, status: face.status }));
  const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
  const scriptUrl = resources.find((url) => url.endsWith('/embed/v1/bc5r.js'));
  const scriptOrigin = scriptUrl ? new URL(scriptUrl).origin : null;
  const fontUrl = resources.find((url) =>
    url.endsWith('/assets/ui/fonts/jersey-10/Jersey10-Regular.woff2'));
  const gameplayAssetUrls = ['ts.png', 'b6.png', 'hud.png'].map((file) =>
    resources.find((url) => new URL(url).pathname.endsWith('/assets/art/hd/' + file)));
  const audioResponse = scriptUrl
    ? await fetch(new URL('../../assets/audio/original/modern/ingame0.ogg', scriptUrl))
    : null;
  return JSON.stringify({
    fontFamily: getComputedStyle(hud).fontFamily,
    fontSize: getComputedStyle(value).fontSize,
    jerseyFaces,
    scriptLoaded: Boolean(scriptUrl),
    fontAssetLoaded: Boolean(fontUrl),
    assetOriginsCorrect: [fontUrl, ...gameplayAssetUrls]
      .every((url) => url && new URL(url).origin === scriptOrigin),
    gameplayAssetsLoaded: gameplayAssetUrls.every(Boolean),
    audioCorsReadable: Boolean(audioResponse?.ok),
  });
})()
`;

export function assertStandaloneEmbedSmoke(payload) {
  if (
    !payload.fontFamily.includes("BC5R Jersey 10") ||
    payload.fontSize !== "36px" ||
    !payload.jerseyFaces.some((face) => face.status === "loaded") ||
    !payload.scriptLoaded ||
    !payload.fontAssetLoaded ||
    !payload.assetOriginsCorrect ||
    !payload.gameplayAssetsLoaded ||
    !payload.audioCorsReadable
  )
    throw new Error(
      `standalone Embed 资源加载异常：${JSON.stringify(payload)}`,
    );
}

export async function runStandaloneEmbedSmoke(
  runBrowserEval,
  url,
  parseResult,
) {
  const result = await runBrowserEval(url, standaloneEmbedSmokeScript);
  if (result.status !== 0)
    throw new Error(`standalone Embed 检查失败：${result.stderr || result.stdout}`);
  assertStandaloneEmbedSmoke(parseResult(result.stdout));
}
