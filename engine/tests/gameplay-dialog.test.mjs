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

test("实体对白按接触方向翻页，其他方向结束并移动", () => {
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 0, false, false, "up"),
    "advance",
  );
  for (const key of ["ArrowDown", "ArrowLeft", "ArrowRight"])
    assert.equal(
      resolveGameplayDialogKeyAction(key, 0, false, false, "up"),
      "move",
    );
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 0, false, true, "up"),
    "ignore",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 0, true, false, "up"),
    "ignore",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowLeft", 0, true, false, "up"),
    "move",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("Enter", 0, true, false, "up"),
    "finish-typing",
  );
  assert.equal(
    resolveGameplayDialogKeyAction("ArrowUp", 0, false, false),
    "ignore",
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
