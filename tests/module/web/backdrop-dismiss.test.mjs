import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { createBackdropDismissHandlers } from "../../../web/src/shared/dialog/backdropDismiss.ts";

function pointerEvent(pointerId, target, currentTarget) {
  return { pointerId, target, currentTarget };
}

test("遮罩关闭要求按下和释放都发生在遮罩空白处", () => {
  const backdrop = {};
  const panel = {};
  let dismissCount = 0;
  const handlers = createBackdropDismissHandlers(() => dismissCount++);

  handlers.pointerDown(pointerEvent(1, panel, backdrop));
  handlers.pointerUp(pointerEvent(1, backdrop, backdrop));
  assert.equal(dismissCount, 0);

  handlers.pointerDown(pointerEvent(2, backdrop, backdrop));
  handlers.pointerUp(pointerEvent(2, panel, backdrop));
  assert.equal(dismissCount, 0);

  handlers.pointerDown(pointerEvent(3, backdrop, backdrop));
  handlers.pointerCancel(pointerEvent(3, backdrop, backdrop));
  handlers.pointerUp(pointerEvent(3, backdrop, backdrop));
  assert.equal(dismissCount, 0);

  handlers.pointerDown(pointerEvent(4, backdrop, backdrop));
  handlers.pointerUp(pointerEvent(4, backdrop, backdrop));
  assert.equal(dismissCount, 1);
});

test("所有可关闭背景的面板共用完整指针手势规则", async () => {
  const sources = await Promise.all([
    "../../../web/src/pages/editor/EditorFileDialog.vue",
    "../../../web/src/pages/home/HomeModeMenu.vue",
    "../../../web/src/app/dialogs/GlobalDialogLayer.vue",
    "../../../web/src/app/AppRoot.vue",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));

  for (const source of sources) {
    assert.match(source, /createBackdropDismissHandlers/);
    assert.match(source, /@pointerdown=/);
    assert.match(source, /@pointerup=/);
    assert.match(source, /@pointercancel=/);
    assert.doesNotMatch(source, /@(click|pointerdown)\.self=/);
  }
});
