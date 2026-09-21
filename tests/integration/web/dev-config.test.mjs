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
});

function resolveAlias(aliases, packageName) {
  const alias = aliases.find((entry) => entry.find === packageName);
  return alias?.replacement;
}
