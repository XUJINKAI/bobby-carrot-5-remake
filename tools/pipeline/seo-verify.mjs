import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const dist = path.join(root, "dist");
const siteOrigin = (
  process.env.VITE_SITE_ORIGIN ?? "https://bc5r.xujinkai.net"
).replace(/\/+$/, "");

export function verifySeoArtifacts() {
  assertShell("index.html", {
    title: "兔子波比5重制版 - 在线玩",
    robots: "index,follow",
    canonical: `${siteOrigin}/`,
    contains: [
      "免下载的在线解谜游戏平台",
      "Robo 2 和推箱子",
      "录像回放",
    ],
  });
  assertShell("en/index.html", {
    title: "Bobby Carrot 5 Remake - Play Online",
    robots: "index,follow",
    canonical: `${siteOrigin}/en`,
    contains: ["no downloads required", "Robo 2 and Sokoban", "watch replays"],
  });
  assertHomePage("index.html", "zh-CN", "兔子波比5重制版", "无需下载安装");
  assertHomePage("en/index.html", "en", "Bobby Carrot 5 Remake", "no download or installation");
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
  assertShell("explore/loma-pushbox/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/explore/loma`,
  });
  assertShell("explore/play/novoban-pushbox/01/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/explore/play/novoban/01`,
  });
  assertShell("edit/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/edit`,
  });
  assertShell("edit/test/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/edit/test`,
  });
  assertShell("settings/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/settings`,
  });

  for (const file of ["404.html", "robots.txt", "sitemap.xml"])
    if (!fs.existsSync(path.join(dist, file)))
      throw new Error(`Missing SEO artifact: dist/${file}`);

  const notFound = read("404.html");
  if (!notFound.includes('name="robots" content="noindex,follow"'))
    throw new Error("404.html must be noindex,follow");
  if (!notFound.includes('src="/assets/art/hd/sleep.png"'))
    throw new Error("404.html must display sleep.png");
  if (!notFound.includes('<a href="/">'))
    throw new Error("404.html must link back to the home page");
  if (!notFound.includes('gtag("config", "G-KZKWTSQXMP")'))
    throw new Error("404.html must include GA4");
  if (!fs.existsSync(path.join(dist, "assets/art/hd/sleep.png")))
    throw new Error("404 sleep.png must be published to dist");

  const robots = read("robots.txt");
  if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`))
    throw new Error("robots.txt must declare the production sitemap");

  const sitemap = read("sitemap.xml");
  for (const expected of [
    `${siteOrigin}/`,
    `${siteOrigin}/en`,
    `${siteOrigin}/adventure/chapter/1`,
    `${siteOrigin}/explore`,
     `${siteOrigin}/explore/play/original/1-1`,
    `${siteOrigin}/edit`,
    `${siteOrigin}/embed`,
  ])
    if (!sitemap.includes(`<loc>${expected}</loc>`))
      throw new Error(`sitemap is missing canonical URL: ${expected}`);
  for (const excluded of [
    "/explore/original",
    "/explore/loma-pushbox",
    "/explore/play/novoban-pushbox/01",
    "/settings",
    "/import/v1",
    "/adventure/play/1-1",
    "/edit/test",
  ])
    if (sitemap.includes(`<loc>${siteOrigin}${excluded}</loc>`))
      throw new Error(`sitemap must not include noindex/alias URL: ${excluded}`);

  if (fs.existsSync(path.join(dist, "explore/original/index.html")))
    throw new Error("/explore/original must not generate a route shell");
  if (fs.existsSync(path.join(dist, "edit/original/1-1/index.html")))
    throw new Error("Editor map source uses a fragment, not a route shell");
}

function assertHomePage(relative, locale, name, lead) {
  const html = read(relative);
  const body = html.split("<body>")[1] ?? "";
  if (!html.includes(`<html lang="${locale}"`))
    throw new Error(`${relative}: 首页语言标记错误`);
  if (!body.includes(`data-home-prerendered="${locale}"`) ||
      !new RegExp(`<h1[^>]*>${name}</h1>`).test(body) ||
      !body.includes(lead))
    throw new Error(`${relative}: 首页必须预渲染对应语言的标题和正文`);
  for (const [language, route] of [["zh-CN", "/"], ["en", "/en"]]) {
    if (!html.includes(`hreflang="${language}" href="${siteOrigin}${route}"`))
      throw new Error(`${relative}: 缺少首页语言关联 ${language}`);
  }
  for (const route of ["/explore", "/adventure", "/edit", "/embed"]) {
    if (!body.includes(`href="${route}"`))
      throw new Error(`${relative}: 预渲染正文缺少导航 ${route}`);
  }
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)];
  if (!styles.some((match) => match[1].includes("mountHomePage")))
    throw new Error(`${relative}: 首屏必须直接加载首页样式`);
  for (const [, href] of styles) {
    if (!fs.existsSync(path.join(dist, href)))
      throw new Error(`${relative}: 首页样式不存在 ${href}`);
  }
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)];
  if (scripts.length !== 1)
    throw new Error(`${relative}: 首页应提供一份结构化数据`);
  const data = JSON.parse(scripts[0][1]);
  if (data.name !== name || data.inLanguage !== locale)
    throw new Error(`${relative}: 首页结构化数据语言或名称错误`);
}

function assertShell(relative, expected) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file))
    throw new Error(`Missing route shell: dist/${relative}`);
  const html = fs.readFileSync(file, "utf8");
  assertSingleMeta(html, relative, "name", "description");
  assertSingleMeta(html, relative, "property", "og:title");
  assertSingleMeta(html, relative, "property", "og:description");
  if (!html.includes(`name="robots" content="${expected.robots}"`))
    throw new Error(`${relative}: wrong robots value`);
  if (!html.includes(`rel="canonical" href="${expected.canonical}"`))
    throw new Error(`${relative}: wrong canonical URL`);
  if (!html.includes('property="og:image"'))
    throw new Error(`${relative}: missing og:image`);
  if (
    !html.includes(
      "https://www.googletagmanager.com/gtag/js?id=G-KZKWTSQXMP",
    ) ||
    !html.includes('gtag("config", "G-KZKWTSQXMP")')
  )
    throw new Error(`${relative}: missing GA4`);
  if (expected.title && !html.includes(expected.title))
    throw new Error(`${relative}: wrong title`);
  for (const text of expected.contains ?? [])
    if (!html.includes(text))
      throw new Error(`${relative}: missing SEO fallback text: ${text}`);
}

function assertSingleMeta(html, relative, attribute, key) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${escapeRegExp(key)}"(?=[\\s/>])`,
    "g",
  );
  const count = [...html.matchAll(pattern)].length;
  if (count !== 1)
    throw new Error(
      `${relative}: ${attribute}=${key} must occur exactly once, got ${count}`,
    );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function read(relative) {
  return fs.readFileSync(path.join(dist, relative), "utf8");
}
