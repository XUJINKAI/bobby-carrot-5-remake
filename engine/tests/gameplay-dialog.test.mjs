import assert from "node:assert/strict";
import test from "node:test";
import {
  cycleOptionIndex,
  resolveGameplayDialogKeyAction,
} from "../dist/ui/GameplayDialog.js";

test("GameplayDialogView 左右选择在任意数量选项间循环", () => {
  assert.equal(cycleOptionIndex(0, 5, 1), 1);
  assert.equal(cycleOptionIndex(4, 5, 1), 0);
  assert.equal(cycleOptionIndex(0, 5, -1), 4);
  assert.equal(cycleOptionIndex(2, 0, 1), -1);
});

test("无选项对白由任意方向键推进，同一次持续按键也可翻页", () => {
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])
    assert.equal(resolveGameplayDialogKeyAction(key, 0, false, false), "advance");
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 0, false, true),
    "advance",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 0, true, false),
    "finish-typing",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 2, false, false),
    "ignore",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("Enter", 2, false, false),
    "select",
  );
});
