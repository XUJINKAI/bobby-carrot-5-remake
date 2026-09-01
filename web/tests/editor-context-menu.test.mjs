import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

test("编辑器右键菜单在菜单内按下时保持打开", () => {
  const component = fs.readFileSync(
    new URL("../src/pages/editor/EditorContextMenu.vue", import.meta.url),
    "utf8",
  );
  assert.match(component, /@pointerdown\.stop/);
});
