import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const dist = path.join(root, "dist");
const assets = path.join(root, "assets");
const siteOrigin = normalizeOrigin(
  process.env.VITE_SITE_ORIGIN ?? "https://bc5r.xujinkai.net",
);
const brand = "兔子波比5重制版";
const ogImagePath = "/assets/art/hd/title.png";

export function generateSeoArtifacts() {
  const sourceHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const routes = buildPublicRoutes();

  const seen = new Set();
  for (const route of routes) {
    if (seen.has(route.path)) throw new Error(`重复 public route：${route.path}`);
    seen.add(route.path);
    writeRouteShell(sourceHtml, route);
  }

  writeNotFoundPage();
  writeRobots();
  writeSitemap(routes.filter((route) => route.index));
  return routes;
}

function buildPublicRoutes() {
  const collectionsIndex = readJson(path.join(assets, "maps/index.json"));
  const collections = collectionsIndex.collections.map((summary) => ({
    id: summary.id,
    ...readJson(path.join(assets, `maps/${summary.id}/index.json`)),
  }));
  const adventure = readJson(path.join(assets, "adventure/index.json"));

  const routes = [
    route(
      "/",
      "兔子波比5重制版 | Bobby Carrot 5 Remake",
      "在浏览器中游玩《兔子波比5》重制版：复刻原版 40 章 400 个关卡与 80 个奖励关，并提供自由探索、地图编辑器、分享与网页内嵌。",
    ),
    route(
      "/adventure",
      `冒险模式 | ${brand}`,
      "按原版章节结构体验《兔子波比5》冒险模式，推进关卡、保存进度、获得奖励，并体验海狸商店、夜间列车等经典冒险机制。",
    ),
    route(
      "/adventure/chapters",
      `章节选择 | 冒险模式 | ${brand}`,
      "浏览《兔子波比5》冒险模式的 40 个章节，查看章节难度与完成进度并继续挑战。",
    ),
    route(
      "/adventure/night-train",
      `夜间列车 | 冒险模式 | ${brand}`,
      "进入《兔子波比5》冒险模式的夜间列车，前往 Dream Machine、Cloud 9 等特殊区域。",
    ),
    route(
      "/edit",
      "兔子波比5地图编辑器 | 创建、试玩与分享地图",
      "在浏览器中使用《兔子波比5》的地形、机关和道具创建自己的地图，随时试玩，并通过链接、文件或网页内嵌分享。",
    ),
    route(
      "/embed",
      "网页内嵌 | 将兔子波比5地图嵌入你的网站",
      "使用 BC5R Embed 将《兔子波比5》地图嵌入其他网页，自定义地图、尺寸、音频和显示配置。",
    ),
    route(
      "/settings",
      `设置 | ${brand}`,
      "调整 Bobby Carrot 5 Remake 的语言、主题、音乐和控制选项。",
      false,
    ),
    route(
      "/import/v1",
      `导入分享数据 | ${brand}`,
      "导入 Bobby Carrot 5 Remake 分享数据。",
      false,
    ),
  ];

  for (const chapter of adventure.chapters) {
    const chapterNumber = String(Number(chapter.id)).padStart(2, "0");
    routes.push(
      route(
        `/adventure/chapter/${chapter.id}`,
        `第 ${chapterNumber} 章：${chapter.name} | ${brand}`,
        chapter.description || `浏览《兔子波比5》冒险模式第 ${chapterNumber} 章的关卡。`,
      ),
    );
    for (const level of chapter.levels) {
      routes.push(
        route(
          `/adventure/play/${level.id}`,
          `关卡 ${level.id.toUpperCase()} | 冒险模式 | ${brand}`,
          `游玩《兔子波比5》冒险模式关卡 ${level.id.toUpperCase()}。`,
          false,
        ),
      );
    }
  }

  const specialRoutes = new Map([
    ["beaver-shop", "/adventure/beaver-shop"],
    ["dream-machine", "/adventure/night-train/dream-machine"],
    ["cloud-9", "/adventure/night-train/cloud-9"],
  ]);
  for (const scene of adventure.specialScenes) {
    const pathname = specialRoutes.get(scene.id);
    if (!pathname) continue;
    routes.push(
      route(
        pathname,
        `${scene.name} | 冒险模式 | ${brand}`,
        `进入《兔子波比5》冒险模式的 ${scene.name} 特殊场景。`,
        false,
      ),
    );
  }

  for (const collection of collections) {
    const collectionPath = collection.id === "original"
      ? "/explore"
      : `/explore/${encodeURIComponent(collection.id)}`;
    routes.push(
      route(
        collectionPath,
        collection.id === "original"
          ? `自由探索 | ${brand}`
          : `${collection.name} | 自由探索 | ${brand}`,
        collection.description || `浏览并在线游玩「${collection.name}」地图合集。`,
      ),
    );

    for (const map of collection.maps) {
      const mapTitle = normalizeMapTitle(map.name, map.id);
      routes.push(
        route(
          `/explore/play/${encodeURIComponent(collection.id)}/${encodeURIComponent(map.id)}`,
          `${mapTitle} | ${brand}`,
          map.description
            ? `在线游玩「${map.name}」。${map.description}`
            : `在线游玩「${map.name}」。`,
        ),
      );
    }
  }

  return routes;
}

function route(pathname, title, description, index = true) {
  return { path: pathname, title, description, index };
}

function normalizeMapTitle(name, id) {
  const trimmed = String(name).trim();
  return trimmed.toLowerCase() === String(id).toLowerCase()
    ? trimmed
    : `${trimmed} · ${String(id).toUpperCase()}`;
}

function writeRouteShell(sourceHtml, descriptor) {
  const canonical = `${siteOrigin}${descriptor.path === "/" ? "/" : descriptor.path}`;
  const robots = descriptor.index ? "index,follow" : "noindex,follow";
  const head = [
    `<meta name="description" content="${escapeAttribute(descriptor.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeAttribute(canonical)}" />`,
    `<meta property="og:site_name" content="Bobby Carrot 5 Remake" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttribute(descriptor.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(descriptor.description)}" />`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}" />`,
    `<meta property="og:image" content="${escapeAttribute(`${siteOrigin}${ogImagePath}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttribute(descriptor.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(descriptor.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttribute(`${siteOrigin}${ogImagePath}`)}" />`,
    descriptor.path === "/"
      ? `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Bobby Carrot 5 Remake",
          alternateName: "BC5R",
          url: `${siteOrigin}/`,
        })}</script>`
      : "",
  ].filter(Boolean).join("\n    ");

  const html = sourceHtml
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(descriptor.title)}</title>`)
    .replace("</head>", `    ${head}\n  </head>`);
  const target = descriptor.path === "/"
    ? path.join(dist, "index.html")
    : path.join(dist, descriptor.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

function writeNotFoundPage() {
  const title = `页面不存在 | ${brand}`;
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,follow" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { min-height: 100%; margin: 0; }
      body {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 50% 40%, rgba(77, 128, 214, 0.28), transparent 34rem),
          #143778;
        color: #f5f8ff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        display: grid;
        justify-items: center;
        gap: 28px;
        padding: 40px 24px;
        text-align: center;
      }
      img {
        display: block;
        width: clamp(160px, 28vw, 280px);
        max-width: 72vw;
        height: auto;
      }
      a {
        color: #f5f8ff;
        font-size: 1rem;
        font-weight: 650;
        text-decoration-color: rgba(245, 248, 255, 0.6);
        text-underline-offset: 5px;
      }
      a:hover { text-decoration-color: currentColor; }
    </style>
  </head>
  <body>
    <main>
      <img src="/assets/art/hd/sleep.png" alt="睡着的兔子波比" />
      <a href="/">返回首页</a>
    </main>
  </body>
</html>
`;
  fs.writeFileSync(path.join(dist, "404.html"), html);
}

function writeRobots() {
  fs.writeFileSync(
    path.join(dist, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`,
  );
}

function writeSitemap(routes) {
  const urls = routes.map((entry) => {
    const location = `${siteOrigin}${entry.path === "/" ? "/" : entry.path}`;
    return `  <url><loc>${escapeXml(location)}</loc></url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(dist, "sitemap.xml"), xml);
}

function normalizeOrigin(value) {
  return String(value).replace(/\/+$/, "");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return escapeAttribute(value).replaceAll("'", "&apos;");
}
