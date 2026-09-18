import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const dist = path.join(root, "dist");
const siteOrigin = (
  process.env.VITE_SITE_ORIGIN ?? "https://bc5r.xujinkai.net"
).replace(/\/+$/, "");

export function verifySeoArtifacts() {
  assertShell("index.html", {
    title: "Bobby Carrot 5 Remake",
    robots: "index,follow",
    canonical: `${siteOrigin}/`,
    contains: [
      "Bobby Carrot 5 Remake",
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
    "/settings",
    "/import/v1",
    "/adventure/play/1-1",
  ])
    if (sitemap.includes(`<loc>${siteOrigin}${excluded}</loc>`))
      throw new Error(`sitemap must not include noindex/alias URL: ${excluded}`);

  if (fs.existsSync(path.join(dist, "explore/original/index.html")))
    throw new Error("/explore/original must not generate a route shell");
  if (fs.existsSync(path.join(dist, "edit/original/1-1/index.html")))
    throw new Error("Editor map source uses a fragment, not a route shell");
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
