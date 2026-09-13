import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import HelpDialog from "../src/app/dialogs/HelpDialog.vue";
import { renderHelpMarkdown } from "../src/app/dialogs/helpMarkdown.ts";
import { unifiedHelpDescriptor } from "../src/shell/shellBridge.ts";

test("所有页面共用完整的操作说明", () => {
  const content = renderHelpMarkdown(unifiedHelpDescriptor());
  assert.match(content, /<h2>游戏<\/h2>/);
  assert.match(content, /<h2>Editor<\/h2>/);
  assert.match(content, /<li><strong>WASD \/ 方向键<\/strong>：控制移动<\/li>/);
  assert.match(content, /<li><strong>Ctrl\+Z<\/strong>：撤销<\/li>/);
  assert.match(content, /<li><strong>滚轮\/\+\-\/双指捏合<\/strong>：缩放地图 &amp; 平移地图<\/li>/);
});

test("帮助 Markdown 将原始 HTML 转为文本", () => {
  const content = renderHelpMarkdown("## 测试\n\n<script>alert(1)</script>");
  assert.match(content, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(content, /<script>/);
});

test("Help Dialog 渲染 Markdown 标题和列表", async () => {
  const app = createSSRApp(HelpDialog, { markdown: unifiedHelpDescriptor() });
  const html = await renderToString(app);
  assert.match(html, /<h2>游戏<\/h2>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<strong>Ctrl\+Z<\/strong>/);
});

test("页面配置不维护完整快捷键清单", async () => {
  const pageSources = await Promise.all([
    "../src/app/pageChrome.ts",
    "../src/pages/editor/editorShell.ts",
    "../src/pages/game/mountGamePage.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const source = pageSources.join("\n");

  assert.doesNotMatch(source, /BROWSE_HELP|GAME_HELP|EDITOR_HELP/);
  assert.doesNotMatch(source, /录制 Replay 测试输入（Tab）/);
  assert.doesNotMatch(source, /方向键 \/ WASD 移动/);
  assert.doesNotMatch(source, /title: "(?:选择|画笔|填充|删除) \([1-4]\)"/);
});
