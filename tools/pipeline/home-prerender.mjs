import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { root } from "../lib/fs.mjs";
import { HOME_ROUTES } from "../../web/src/app/homeRoutes.js";

export async function prerenderHomePages() {
  const dist = path.join(root, "dist");
  const { prerenderHome } = await import(pathToFileURL(
    path.join(root, "tmp/home-prerender/home.mjs"),
  ).href);
  const manifest = JSON.parse(fs.readFileSync(
    path.join(dist, ".vite/manifest.json"), "utf8",
  ));
  const styles = collectStyles(manifest, "src/pages/home/mountHomePage.ts");

  // Web i18n 在此构建进程中顺序切换；两份 HTML 始终使用同一套 Vue 组件。
  for (const route of HOME_ROUTES) {
    const file = path.join(dist, route.path.slice(1), "index.html");
    const source = fs.readFileSync(file, "utf8");
    const base = source.match(/<base href="([^"]+)"/)?.[1] ?? "/";
    const css = styles
      .filter((style) => !source.includes(`${base}${style}`))
      .map((style) => `<link rel="stylesheet" href="${base}${style}" />`)
      .join("\n    ");
    const body = await prerenderHome(route.locale);
    if (!source.includes('<div id="app"></div>'))
      throw new Error(`首页预渲染缺少挂载入口：${file}`);
    const html = source
      .replace('<div id="app"></div>',
        `<div id="app" data-home-prerendered="${route.locale}">${body}</div>`)
      .replace("</head>", `    ${css}\n  </head>`);
    fs.writeFileSync(file, html);
  }
  fs.rmSync(path.join(dist, ".vite"), { recursive: true });
}

function collectStyles(manifest, entry) {
  const styles = new Set();
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`首页资源清单缺少 ${key}`);
    for (const dependency of chunk.imports ?? []) visit(dependency);
    for (const style of chunk.css ?? []) styles.add(style);
  };
  visit(entry);
  return [...styles];
}
