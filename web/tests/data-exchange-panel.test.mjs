import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

const panel = await readFile(
  new URL("../src/shared/data-exchange/DataExchangePanel.vue", import.meta.url),
  "utf8",
);
const editorDialog = await readFile(
  new URL("../src/pages/editor/EditorFileDialog.vue", import.meta.url),
  "utf8",
);
const settingsPage = await readFile(
  new URL("../src/pages/settings/SettingsPage.vue", import.meta.url),
  "utf8",
);
const editorStyle = await readFile(
  new URL("../../editor/style.css", import.meta.url),
  "utf8",
);

test("数据交换面板使用紧凑信息行和固定操作分组", () => {
  const meta = panel.indexOf('class="data-exchange-meta"');
  const textarea = panel.indexOf('class="data-exchange-text"');
  const actions = panel.indexOf('class="data-exchange-actions"');
  const importText = panel.indexOf('data-exchange-action="importText"');
  const importFile = panel.indexOf('data-exchange-action="importFile"');
  const download = panel.indexOf('data-exchange-action="download"');
  const copy = panel.indexOf('data-exchange-action="copy"');

  assert.ok(meta >= 0 && meta < textarea);
  assert.ok(textarea < actions);
  assert.ok(importText < importFile);
  assert.ok(importFile < download);
  assert.ok(download < copy);
  assert.match(panel, /bytes < 1024 \? `\$\{bytes\}B`/);
  assert.match(panel, /webT\("common\.import"\)/);
  assert.match(panel, /webT\("common\.exportFile"\)/);
  assert.match(
    panel,
    /props\.publicBaseUrl \? "common\.compressToLink" : "common\.compress"/,
  );
  assert.match(
    panel,
    /data-exchange-compression[\s\S]*payloadSize[\s\S]*<\/label>/,
  );
  assert.match(
    panel,
    /class="data-exchange-primary"[\s\S]*data-exchange-action="importText"/,
  );
  assert.match(
    panel,
    /class="data-exchange-primary"[\s\S]*data-exchange-action="copy"/,
  );
  assert.doesNotMatch(
    panel,
    /data-exchange-primary\s*\{[^}]*border-color:\s*var\(--bc-highlight\)/,
  );
});

test("现有压缩入口生成完整链接", () => {
  assert.match(editorDialog, /:public-base-url="publicBaseUrl\(\)"/);
  assert.match(settingsPage, /:public-base-url="publicBaseUrl\(\)"/);
});

test("Editor 分享面板单独覆盖数据文本区背景", () => {
  assert.match(editorDialog, /class="editor-data-exchange"/);
  assert.match(editorDialog, /#metaAction/);
  assert.match(editorDialog, /class="editor-data-exchange-embed-link"/);
  assert.match(panel, /--data-exchange-text-bg/);
  assert.match(panel, /--data-exchange-action-bg/);
  assert.match(
    panel,
    /class="data-exchange-meta-action"[\s\S]*<slot name="metaAction" \/>/,
  );
  assert.match(
    panel,
    /\.data-exchange-meta-action\s*\{[^}]*margin-left: auto;/,
  );
  assert.match(
    editorStyle,
    /\.editor-data-exchange\s*\{[\s\S]*--data-exchange-text-bg: #0b130e;[\s\S]*--data-exchange-action-bg: #0b130e;/,
  );
  assert.match(
    editorStyle,
    /\.editor-data-exchange-embed-link\s*\{\s*font-size: 1rem;/,
  );
});
