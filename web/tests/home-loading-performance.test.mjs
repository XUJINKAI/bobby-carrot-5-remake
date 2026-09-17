import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Home 首屏按路由加载页面代码和非关键数据", async () => {
  const [app, entry] = await Promise.all([
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(app, /from ["']\.\.\/pages\//);
  assert.match(app, /import\("\.\.\/pages\/home\/mountHomePage\.js"\)/);
  assert.match(app, /scheduleHomePrefetch\(\)/);
  assert.match(app, /prefetchMaps\(/);
  assert.doesNotMatch(app, /images\.preload\(\)/);
  assert.doesNotMatch(entry, /editor\.css/);
});

test("Editor 样式和 Help Markdown 由所属构建阶段处理", async () => {
  const [editorMount, packageJson, sourceFiles] = await Promise.all([
    readFile(
      new URL("../src/pages/editor/mountEditorPage.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    Promise.all([
      readFile(new URL("../src/content/help.md", import.meta.url), "utf8"),
      readFile(
        new URL("../build/markdownHtmlPlugin.ts", import.meta.url),
        "utf8",
      ),
    ]),
  ]);
  const manifest = JSON.parse(packageJson);

  assert.match(editorMount, /editor\.css/);
  assert.ok(sourceFiles[0].length > 0);
  assert.match(sourceFiles[1], /from "markdown-it"/);
  assert.equal(manifest.dependencies?.["markdown-it"], undefined);
  assert.equal(typeof manifest.devDependencies?.["markdown-it"], "string");
});
