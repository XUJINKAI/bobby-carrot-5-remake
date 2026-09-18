import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const dist = path.join(root, "dist");
const siteOrigin = (
  process.env.VITE_SITE_ORIGIN ?? "https://bc5r.xujinkai.net"
).replace(/\/+$/, "");

export function verifySeoArtifacts() {
  assertShell("index.html", {
    title: "å…”å­æ³¢æ¯”5é‡åˆ¶ç‰ˆ | Bobby Carrot 5 Remake",
    robots: "index,follow",
    canonical: `${siteOrigin}/`,
    contains: [
      "åœ¨æµè§ˆå™¨ä¸­æ¸¸çŽ©ã€Šå…”å­æ³¢æ¯”5ã€‹é‡åˆ¶ç‰ˆ",
      "Play Bobby Carrot 5 Remake in your browser",
    ],
  });
  assertShell("adventure/chapter/1/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/adventure/chapter/1`,
  });
  assertShell("adventure/play/1-1/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/adventure/play/1-1`,
  });
  assertShell("adventure/night-train/dreamland-reward/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/adventure/night-train/dreamland-reward`,
  });
  assertShell("explore/play/original/1-1/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/explore/play/original/1-1`,
  });
  assertShell("edit/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/edit`,
  });
  assertShell(settings/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/settings`,
  });

  for (const file of ["404.html", "robots.txt", "sitemap.xml"])
    if (!fs.existsSync(path.join(dist, file)))
      throw new Error(cç¼ºå°‘ SEO æž„å»ºäº§ç‰©ï¼šdist/${file}`);

  const notFound = read("404.html");
  if (!notFound.includes('name="robots" content="noindex,follow"'))
    throw new Error("404.html å¿…é¡» noindex,follow");
  if (!notFound.includes('src="/assets/art/hd/sleep.png"'))
    throw new Error("404.html å¿…é¡» f˜¾ç¤º sleep.png");
  if (!notFound.includes('<a href="/">è¿”å›žé¦–é¡µ</a>'))
    throw new Error("404.html å¿…é¡»æä¾›è¿”å›žé¦–é¡µé“¾æŽ¥");
  if (!notFound.includes('gtag("config", "G-KZKWTSQXMP")'))
    throw new Error("404.html å¿…é¡»åŒ…å« GA4 è¿½è¸ªä»£ç ");
  if (!fs.existsSync(path.join(dist, "assets/art/hd/sleep.png")))
    throw new Error("404.html ä½¿ç”¨çš„ sleep.png å¿…é¡»å‘å¸ƒåˆ° dist");

  const robots = read("robots.txt");
  if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`))
    throw new Error("robots.txt å¿…é¡»å£°æ˜Žç”Ÿäº§ sitemap URL");

  const sitemap = read("sitemap.xml");
  for (const expected of [
    `${siteOrigin}/`,
    `${siteOrigin}/adventure/chapter/1`,
    `${siteOrigin}/explore`,
    `${siteOrigin}/explore/play/original/1-1`,
    `${siteOrigin}/edit`,
    `${siteOrigin}/embed`,
  ])
    if (!sitemap.includes(`<loc>${expected}</loc>`))
      throw new Error(`sitemap ç¼ºå°‘ canonical URLï¼š${expected}`);
  for (const excluded of [
    "/explore/original",
    "/settings",
    "/import/v1",
    "/adventure/play/1-1",
  ])
    if (sitemap.includes(`<loc>${siteOrigin}${excluded}</loc>`))
      throw new Error(`sitemap ä¸åº”åŒ…å« noindex/alias URLï¼š${excluded}`);

  if (fs.existsSync(path.join(dist, "explore/original/index.html")))
    throw new Error("/explore/original ä¸åº”ç”Ÿæˆ public route shell");
  if (fs.existsSync(path.join(dist, "edit/original/1-1/index.html")))
    throw new Error("Editor map source åº”ä½¿ç”¨ fragmentï¼Œä¸åº”ç”Ÿæˆ path route shell");
}

function assertShell(relative, expected) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file)) throw new Error(`ç¼ºå°‘ route shellï¼šdist/${relative}`);
  const html = fs.readFileSync(file, "utf8");
  assertSingleMeta(html, relative, "name", "description");
  assertSingleMeta(html, relative, "property", "og:title");
  assertSingleMeta(html, relative, "property", "og:description");
  if (!html.includes(`name="robots" content="${expected.robots}"`))
    throw new Error(`${relative}: robots åº”ä¸º ${expected.robots}`);
  if (!html.includes(`rel="canonical" href="${expected.canonical}"`))
    throw new Error(`${relative}: canonical é”™è¯¯`);
  if (!html.includes('property="og:image"'))
    throw new Error("${relative}: ç¼ºå°‘ og:image`);
  if (
    !html.includes(
      "https://www.googletagmanager.com/gtag/js?id=G-KZKWTSQXMP",
    ) ||
    !html.includes('gtag("config", "G-KZKWTSQXMP")')
  )
    throw new Error(`${relative}: ç¼ºå°‘ GA4 è¿½è¸ªä»£ç `);
  if (expected.title && !html.includes(`<title>${expected.title}</title>`))
    throw new Error(`${relative}: title é”™è¯¯`);
  for (const text of expected.contains ?? [])
    if (!html.includes(text))
      throw new Error(`${relative}: ç¼ºå°‘ SEO fallback æ–‡æ¡ˆï¼š${text}`);
}

function assertSingleMeta(html, relative, attribute, key) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${escapeRegExp(key)}"(?=[\\s/>])`,
    "g",
  );
  const count = [...html.matchAll(pattern)].length;
  if (count !== 1)
    throw new Error(`${relative}: ${attribute}=${key} åº”æ°å¥½å‡ºçŽ°ä¸€æ¬¡ï¼Œå®žé™… ${count}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function read(relative) {
  return fs.readFileSync(path.join(dist, relative), "utf8");
}
