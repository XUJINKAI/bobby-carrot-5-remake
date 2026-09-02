import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const dist = path.join(root, "dist");
const siteOrigin = (
  process.env.VITE_SITE_ORIGIN ?? "https://bc5r.xujinkai.net"
).replace(/\/+$/, "");

export function verifySeoArtifacts() {
  assertShell("index.html", {
    title: "兔子波比5重制版 | Bobby Carrot 5 Remake",
    robots: "index,follow",
    canonical: `${siteOrigin}/`,
  });
  assertShell("adventure/chapter/1/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/adventure/chapter/1`,
  });
  assertShell("adventure/play/1-1/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/adventure/play/1-1`,
  });
  assertShell("explore/play/original/1-1/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/explore/play/original/1-1`,
  });
  assertShell("edit/index.html", {
    robots: "index,follow",
    canonical: `${siteOrigin}/edit`,
  });
  assertShell("settings/index.html", {
    robots: "noindex,follow",
    canonical: `${siteOrigin}/settings`,
  });

  for (const file of ["404.html", "robots.txt", "sitemap.xml"])
    if (!fs.existsSync(path.join(dist, file)))
      throw new Error(`缺少 SEO 构建产物：dist/${file}`);

  const notFound = read("404.html");
  if (!notFound.includes('name="robots" content="noindex,follow"'))
    throw new Error("404.html 必须 noindex,follow");
  if (!notFound.includes('src="/assets/art/hd/sleep.png"'))
    throw new Error("404.html 必须显示 sleep.png");
  if (!notFound.includes('<a href="/">返回首页</a>'))
    throw new Error("404.html 必须提供返回首页链接");

  const robots = read("robots.txt");
  if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`))
    throw new Error("robots.txt 必须声明生产 sitemap URL");

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
      throw new Error(`sitemap 缺少 canonical URL：${expected}`);
  for (const excluded of [
    "/explore/original",
    "/settings",
    "/import/v1",
    "/adventure/play/1-1",
  ])
    if (sitemap.includes(`<loc>${siteOrigin}${excluded}</loc>`))
      throw new Error(`sitemap 不应包含 noindex/alias URL：${excluded}`);

  if (fs.existsSync(path.join(dist, "explore/original/index.html")))
    throw new Error("/explore/original 不应生成 public route shell");
  if (fs.existsSync(path.join(dist, "edit/original/1-1/index.html")))
    throw new Error("Editor map source 应使用 fragment，不应生成 path route shell");
}

function assertShell(relative, expected) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file)) throw new Error(`缺少 route shell：dist/${relative}`);
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('<meta name="description"'))
    throw new Error(`${relative}: 缺少 description`);
  if (!html.includes(`name="robots" content="${expected.robots}"`))
    throw new Error(`${relative}: robots 应为 ${expected.robots}`);
  if (!html.includes(`rel="canonical" href="${expected.canonical}"`))
    throw new Error(`${relative}: canonical 错误`);
  if (!html.includes('property="og:image"'))
    throw new Error(`${relative}: 缺少 og:image`);
  if (expected.title && !html.includes(`<title>${expected.title}</title>`))
    throw new Error(`${relative}: title 错误`);
}

function read(relative) {
  return fs.readFileSync(path.join(dist, relative), "utf8");
}
