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
}
