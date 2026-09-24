import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";
import {
  ADVENTURE_SPECIAL_SCENES,
  adventureChapterSeoDescriptor,
  adventureLevelSeoDescriptor,
  adventureSceneSeoDescriptor,
  bilingualSeoDescriptor,
  collectionSeoDescriptor,
  exploreMapSeoDescriptor,
  staticSeoDescriptor,
} from "../../web/src/seo/seoDescriptors.js";
import { legacyRoutePaths } from "../../web/src/app/routeMigrations.js";

const dist = path.join(root, "dist");
const assets = path.join(root, "assets");
const siteOrigin = normalizeOrigin(
  process.env.VITE_SITE_ORIGIN ?? "https://bc5r.xujinkai.net",
);
const ogImagePath = "/assets/art/hd/title.png";

export function generateSeoArtifacts() {
  const sourceHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const routes = buildPublicRoutes();

  const seen = new Set();
  for (const route of routes) {
    if (seen.has(route.canonicalPath))
      throw new Error(`重复 public route：${route.canonicalPath}`);
    seen.add(route.canonicalPath);
    writeRouteShell(sourceHtml, route);
    for (const legacyPath of legacyRoutePaths(route.canonicalPath)) {
      writeRouteShell(sourceHtml, route, legacyPath);
    }
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
    requireStaticRoute("/"),
    requireStaticRoute("/adventure"),
    requireStaticRoute("/adventure/chapters"),
    requireStaticRoute("/adventure/night-train"),
    requireStaticRoute("/edit"),
    requireStaticRoute("/edit/test"),
    requireStaticRoute("/embed"),
    requireStaticRoute("/settings"),
    requireStaticRoute("/import/v1"),
  ];

  for (const chapter of adventure.chapters) {
    routes.push(
      adventureChapterSeoDescriptor(
        `/adventure/chapter/${chapter.id}`,
        chapter,
      ),
    );
    for (const level of chapter.levels) {
      routes.push(
        adventureLevelSeoDescriptor(
          `/adventure/play/${level.id}`,
          level.id,
        ),
      );
    }
  }

  for (const [sceneId, sceneRoute] of Object.entries(
    ADVENTURE_SPECIAL_SCENES,
  )) {
    const scene = adventure.specialScenes.find((entry) => entry.id === sceneId);
    routes.push(
      adventureSceneSeoDescriptor(
        sceneRoute.path,
        scene?.name ?? sceneRoute.name,
      ),
    );
  }

  for (const collection of collections) {
    const collectionPath = collection.id === "original"
      ? "/explore"
      : `/explore/${encodeURIComponent(collection.id)}`;
    routes.push(collectionSeoDescriptor(collectionPath, collection));

    for (const map of collection.maps) {
      routes.push(
        exploreMapSeoDescriptor(
          `/explore/play/${encodeURIComponent(collection.id)}/${encodeURIComponent(map.id)}`,
          {
            id: map.id,
            name: map.name,
            ...(map.description ? { description: map.description } : {}),
          },
        ),
      );
    }
  }

  return routes;
}

function requireStaticRoute(pathname) {
  const route = staticSeoDescriptor(pathname);
  if (!route) throw new Error(`缺少 static SEO descriptor：${pathname}`);
  return route;
}

function writeRouteShell(
  sourceHtml,
  descriptor,
  outputPath = descriptor.canonicalPath,
) {
  const fallback = bilingualSeoDescriptor(descriptor);
  const canonical =
    `${siteOrigin}${fallback.canonicalPath === "/" ? "/" : fallback.canonicalPath}`;
  const robots = fallback.index ? "index,follow" : "noindex,follow";
  const extraHead = [
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeAttribute(canonical)}" />`,
    `<meta property="og:site_name" content="Bobby Carrot 5 Remake" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}" />`,
    `<meta property="og:image" content="${escapeAttribute(`${siteOrigin}${ogImagePath}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttribute(fallback.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(fallback.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttribute(`${siteOrigin}${ogImagePath}`)}" />`,
    fallback.canonicalPath === "/"
      ? `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Bobby Carrot 5 Remake",
          alternateName: "BC5R",
          url: `${siteOrigin}/`,
        })}</script>`
      : "",
  ].filter(Boolean).join("\n    ");

  const html = replaceBaseSeo(sourceHtml, fallback)
    .replace("</head>", `    ${extraHead}\n  </head>`);
  const target = outputPath === "/"
    ? path.join(dist, "index.html")
    : path.join(dist, outputPath.slice(1), "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

function replaceBaseSeo(sourceHtml, descriptor) {
  return sourceHtml
    .replace(
      /<title>.*?<\/title>/s,
      `<title>${escapeHtml(descriptor.title)}</title>`,
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s,
      `<meta name="description" content="${escapeAttribute(descriptor.description)}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/s,
      `<meta property="og:title" content="${escapeAttribute(descriptor.title)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/s,
      `<meta property="og:description" content="${escapeAttribute(descriptor.description)}" />`,
    );
}

function writeNotFoundPage() {
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,follow" />
    <title>页面不存在 | 兔子波比5重制版</title>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-KZKWTSQXMP"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-KZKWTSQXMP");
    </script>
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
    const location =
      `${siteOrigin}${entry.canonicalPath === "/" ? "/" : entry.canonicalPath}`;
    return `  <url><loc>${escapeXml(location)}</loc></url>`;
  });
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
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
