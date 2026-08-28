import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const roots = [
  new URL("../src/", import.meta.url),
  new URL("../style.css", import.meta.url),
  new URL("../game-ui.css", import.meta.url),
  new URL("../../editor/src/", import.meta.url),
  new URL("../../editor/style.css", import.meta.url),
];
const SOURCE_EXTENSIONS = new Set([".css", ".vue", ".ts", ".js"]);
const BLUR_PATTERN = /backdrop-filter|blur\s*\(/i;

test("Web 和 Editor 样式源不使用实时 blur", async () => {
  const violations = [];
  for (const root of roots) await scan(root, violations);
  assert.deepEqual(violations, []);
});

async function scan(url, violations) {
  const path = fileURLToPath(url);
  const info = await stat(path);
  if (info.isDirectory()) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      await scan(new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url), violations);
    }
    return;
  }
  const extension = path.slice(path.lastIndexOf("."));
  if (!SOURCE_EXTENSIONS.has(extension)) return;
  const source = await readFile(path, "utf8");
  if (BLUR_PATTERN.test(source)) violations.push(path);
}
