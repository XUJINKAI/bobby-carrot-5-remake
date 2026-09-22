import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadConfigFromFile } from "vite";
import { root } from "../../../tools/lib/fs.mjs";

test("开发服务器直接从源码解析浏览器 Runtime workspace", async () => {
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    path.join(root, "web/vite.config.ts"),
  );
  assert.ok(loaded, "无法加载 Vite 开发配置");

  const aliases = loaded.config.resolve?.alias;
  assert.ok(Array.isArray(aliases));
  assert.equal(
    resolveAlias(aliases, "@bobby/exchange"),
    path.join(root, "exchange/src/index.ts"),
  );
  assert.equal(
    resolveAlias(aliases, "@bobby/i18n"),
    path.join(root, "i18n/src/index.ts"),
  );
  assert.ok(
    loaded.config.plugins?.some(
      (plugin) => plugin.name === "bc5r-i18n-markdown",
    ),
  );
});

test("正式构建通过 i18n package 产物解析翻译模块", async () => {
  const loaded = await loadConfigFromFile(
    { command: "build", mode: "production" },
    path.join(root, "web/vite.config.ts"),
  );
  assert.ok(loaded, "无法加载 Vite 正式构建配置");

  const aliases = loaded.config.resolve?.alias;
  assert.ok(Array.isArray(aliases));
  assert.equal(resolveAlias(aliases, "@bobby/i18n"), undefined);
  assert.equal(
    loaded.config.plugins?.some(
      (plugin) => plugin.name === "bc5r-i18n-markdown",
    ),
    false,
  );
});

function resolveAlias(aliases, packageName) {
  const alias = aliases.find((entry) => entry.find === packageName);
  return alias?.replacement;
}
