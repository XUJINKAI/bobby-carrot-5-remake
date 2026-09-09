import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

const sourceRoot = new URL("../src/", import.meta.url);
const adapter = fileURLToPath(
  new URL("../src/shared/icons/AppIcon.vue", import.meta.url),
);
const sourceExtensions = new Set([".ts", ".vue"]);
const legacyIconPattern = /[←→↗↻↶↷✎✕＋▶■⏮⏭♫⚙☰ⓘ⌕▧▦🕹🔒✓⚠⛔⠿−›▾◇]/u;

test("Phosphor 依赖只出现在统一图标适配层", async () => {
  const files = await sourceFiles(sourceRoot);
  const directImports = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (source.includes("@phosphor-icons/vue") && file !== adapter)
      directImports.push(file);
  }
  assert.deepEqual(directImports, []);
});

test("Web 交互界面不再使用旧 Unicode 图标", async () => {
  const files = await sourceFiles(sourceRoot);
  const violations = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (legacyIconPattern.test(source)) violations.push(file);
  }
  assert.deepEqual(violations, []);
});

test("Editor 工具、地图编辑与 Replay 跳转使用指定的 Phosphor 图标", async () => {
  const source = await readFile(adapter, "utf8");
  assert.match(source, /select: PhCursor/);
  assert.match(source, /edit: PhPencilSimple/);
  assert.match(source, /delete: PhTrash/);
  assert.match(source, /fill: PhPaintRoller/);
  assert.match(source, /"edit-map": PhPencilSimple/);
  assert.match(source, /"replay-beginning": PhArrowCounterClockwise/);
  assert.match(source, /"replay-end": PhArrowClockwise/);
});

async function sourceFiles(url) {
  const path = fileURLToPath(url);
  const info = await stat(path);
  if (!info.isDirectory()) {
    const extension = path.slice(path.lastIndexOf("."));
    return sourceExtensions.has(extension) ? [path] : [];
  }
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    files.push(...await sourceFiles(new URL(
      `${entry.name}${entry.isDirectory() ? "/" : ""}`,
      url,
    )));
  }
  return files;
}
