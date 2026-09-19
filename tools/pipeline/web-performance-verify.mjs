import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const MAX_ENTRY_CHUNK_BYTES = 500_000;

export function verifyWebPerformanceArtifacts() {
  const dist = path.join(root, "dist");
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const entrySource = html.match(
    /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="([^"]+)")[^>]*>/,
  )?.[1];
  if (!entrySource) throw new Error("Web 构建产物缺少 module 入口");

  const entryFile = path.join(dist, entrySource.replace(/^\/+/, ""));
  const entrySize = fs.statSync(entryFile).size;
  if (entrySize > MAX_ENTRY_CHUNK_BYTES)
    throw new Error(
      `Web 入口 chunk 为 ${entrySize} bytes，超过 500 kB 性能门禁`,
    );

  const emittedFont = fs
    .readdirSync(path.join(dist, "app"))
    .find((file) => /^Jersey10-Regular-.*\.woff2$/.test(file));
  if (!emittedFont) throw new Error("Web 构建产物缺少 Jersey 10 WOFF2 字体");

  const embedSource = fs.readFileSync(
    path.join(dist, "embed/v1/bc5r.js"),
    "utf8",
  );
  if (!embedSource.includes("assets/ui/fonts/jersey-10/Jersey10-Regular.woff2"))
    throw new Error("Embed 构建产物没有通过共享资源路径加载 Jersey 10");
  if (embedSource.includes("data:font/woff2"))
    throw new Error("Embed 构建产物不应重复内联共享 Jersey 10 字体");

  const vercel = JSON.parse(
    fs.readFileSync(path.join(root, "vercel.json"), "utf8"),
  );
  const appCache = vercel.headers?.find(
    (rule) => rule.source === "/app/(.*)",
  );
  const cacheControl = appCache?.headers?.find(
    (header) => header.key.toLowerCase() === "cache-control",
  );
  if (cacheControl?.value !== "public, max-age=31536000, immutable")
    throw new Error("Vercel 必须为 /app/ 哈希资源配置一年期 immutable 缓存");

  for (const source of ["/embed/v1/(.*)", "/assets/(.*)"]) {
    const rule = vercel.headers?.find((entry) => entry.source === source);
    const allowOrigin = rule?.headers?.find(
      (header) => header.key.toLowerCase() === "access-control-allow-origin",
    );
    if (allowOrigin?.value !== "*")
      throw new Error(`Vercel 必须允许第三方宿主页跨源读取 ${source}`);
  }
  for (const source of ["/embed/v1/(.*)", "/assets/(.*)"]) {
    const rule = vercel.headers?.find((entry) => entry.source === source);
    const resourcePolicy = rule?.headers?.find(
      (header) => header.key.toLowerCase() === "cross-origin-resource-policy",
    );
    if (resourcePolicy?.value !== "cross-origin")
      throw new Error(`Vercel 必须允许第三方宿主页使用 ${source}`);
  }
}
