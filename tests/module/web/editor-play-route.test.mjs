import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

const sources = await Promise.all([
  readFile(new URL("../../../web/src/app/BobbyApp.ts", import.meta.url), "utf8"),
  readFile(
    new URL("../../../web/src/pages/editor/EditorPage.vue", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../../../web/src/pages/editor/mountEditorPage.ts", import.meta.url),
    "utf8",
  ),
]);
const [app, page, mount] = sources;

test("Editor Play Test 使用可直接打开的子路由", () => {
  assert.match(app, /path === "\/edit" \|\| path === "\/edit\/test"/);
  assert.match(app, /path === "\/edit\/test"[\s\S]*renderEditorTestPage/);
  assert.match(page, /storeEditorAutosave\(page\.snapshot\.value\.level/);
  assert.match(page, /props\.navigate\("\/edit\/test"/);
});

test("Play Test 每次读取 autosave 副本并启动正式游戏", () => {
  assert.match(
    mount,
    /renderEditorTestPage[\s\S]*loadEditorAutosave\(\) \?\? createBlankLevel/,
  );
  assert.match(mount, /playRoute: true/);
  assert.match(page, /if \(props\.playRoute\) void togglePlay\(\)/);
});

test("Play Test 返回动作保留浏览器历史语义", () => {
  assert.match(page, /history\.state\?\.editorTestSource === true/);
  assert.match(page, /history\.back\(\)/);
  assert.match(page, /props\.navigate\("\/edit", \{ replace: true \}\)/);
});
