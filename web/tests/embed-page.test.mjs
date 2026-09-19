import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Embed 生成代码与首页示例统一使用 queue + async", async () => {
  const [page, preview] = await Promise.all([
    readFile(new URL("../src/pages/embed/EmbedPage.vue", import.meta.url), "utf8"),
    readFile(
      new URL("../src/pages/home/EmbedFeaturePreview.vue", import.meta.url),
      "utf8",
    ),
  ]);

  for (const source of [page, preview]) {
    assert.match(source, /window\.BC5R = window\.BC5R \|\| \{ queue: \[\] \}/);
    assert.match(source, /BC5R\.queue\.push/);
    assert.match(source, /script async src=/);
    assert.doesNotMatch(source, /crossorigin=/);
    assert.ok(source.indexOf("BC5R.queue.push") < source.indexOf("script async src="));
  }
  assert.doesNotMatch(page, /BC5R\.mount\(\$\{JSON\.stringify/);
  assert.match(page, /Loading Bobby Carrot 5 Remake…/);
  assert.match(page, /width:100%;height:520px;display:grid;place-items:center;\\n  border:1px solid #254868/);
  assert.doesNotMatch(page, /selectAllCode|@click="selectAllCode"|ref="codeBlock"/);
  assert.doesNotMatch(page, /if \(!source\)/);
  assert.doesNotMatch(page, /script\.crossOrigin/);
});
