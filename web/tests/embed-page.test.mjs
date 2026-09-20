import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import {
  generateEmbedCode,
  parseEmbedCode,
} from "../src/pages/embed/embedCode.ts";

test("Embed 生成代码与首页示例统一使用 queue + async", async () => {
  const [page, code, preview] = await Promise.all([
    readFile(new URL("../src/pages/embed/EmbedPage.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/embed/embedCode.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../src/pages/home/EmbedFeaturePreview.vue", import.meta.url),
      "utf8",
    ),
  ]);

  for (const source of [code, preview]) {
    assert.match(source, /window\.BC5R = window\.BC5R \|\| \{ queue: \[\] \}/);
    assert.match(source, /BC5R\.queue\.push/);
    assert.match(source, /script async src=/);
    assert.doesNotMatch(source, /crossorigin=/);
    assert.ok(source.indexOf("BC5R.queue.push") < source.indexOf("script async src="));
  }
  assert.doesNotMatch(code, /BC5R\.mount\(\$\{JSON\.stringify/);
  assert.match(code, /Loading Bobby Carrot 5 Remake…/);
  assert.match(code, /width:100%;height:520px;display:grid;place-items:center;/);
  assert.doesNotMatch(page, /selectAllCode|@click="selectAllCode"|ref="codeBlock"/);
  assert.doesNotMatch(page, /if \(!source\)/);
  assert.doesNotMatch(page, /script\.crossOrigin/);
  assert.match(page, /const hudTimer = ref\(false\)/);
  assert.match(page, /const hudSteps = ref\(false\)/);
  assert.match(page, /timer: hudTimer\.value/);
  assert.match(page, /steps: hudSteps\.value/);
  assert.match(page, /class="hud-timer"/);
  assert.match(page, /class="hud-steps"/);
});

test("Embed 设置先生成可编辑代码，再由代码刷新预览", async () => {
  const page = await readFile(
    new URL("../src/pages/embed/EmbedPage.vue", import.meta.url),
    "utf8",
  );
  assert.match(page, /const embedCode = ref\(""\)/);
  assert.match(page, /watch\(\s*generatedConfig,[\s\S]*embedCode\.value = generateEmbedCode/);
  assert.match(page, /watch\(\s*embedCode,[\s\S]*schedulePreviewRefresh\(\)/);
  assert.match(page, /options = parseEmbedCode\(embedCode\.value\)/);
  assert.match(page, /v-model="embedCode"[\s\S]*class="code-block"/);
  assert.doesNotMatch(page, /<pre class="code-block">/);
});

test("Embed 代码解析只读取 queue JSON 并由预览接管 target", () => {
  const code = generateEmbedCode({
    target: "#external-target",
    map: '{"schemaVersion":1}',
    hud: { timer: false, steps: true },
    info: "括号 ) 与转义 \\\" 都保留",
  }, "https://example.test/embed/v1/bc5r.js");
  const parsed = parseEmbedCode(code);

  assert.equal("target" in parsed, false);
  assert.equal(parsed.map, '{"schemaVersion":1}');
  assert.deepEqual(parsed.hud, { timer: false, steps: true });
  assert.equal(parsed.info, "括号 ) 与转义 \\\" 都保留");
  assert.throws(() => parseEmbedCode("<div>invalid</div>"));
  assert.throws(() => parseEmbedCode("BC5R.queue.push(null);"));
});
