import assert from "node:assert/strict";
import test from "node:test";
import {
  cycleOptionIndex,
  resolveGameplayDialogInputAction,
} from "../../../engine/dist/ui/GameplayDialog.js";

const direction = (value, source = "arrows") => ({
  type: "direction",
  source,
  direction: value,
});

test("GameplayDialogView 左右选择在任意数量选项间循环", () => {
  assert.equal(cycleOptionIndex(0, 5, 1), 1);
  assert.equal(cycleOptionIndex(4, 5, 1), 0);
  assert.equal(cycleOptionIndex(0, 5, -1), 4);
  assert.equal(cycleOptionIndex(2, 0, 1), -1);
});

test("实体对白按统一方向输入翻页，其他方向结束并移动", () => {
  assert.equal(
    resolveGameplayDialogInputAction(direction("up"), 0, false, "up"),
    "advance",
  );
  for (const value of ["down", "left", "right"])
    assert.equal(
      resolveGameplayDialogInputAction(direction(value), 0, false, "up"),
      "move",
    );
  assert.equal(
    resolveGameplayDialogInputAction(direction("up", "wasd"), 0, true, "up"),
    "finish-typing",
  );
  assert.equal(
    resolveGameplayDialogInputAction(direction("left", "pointer"), 0, true, "up"),
    "move",
  );
  assert.equal(
    resolveGameplayDialogInputAction(
      { type: "confirm", source: "keyboard" },
      0,
      true,
      "up",
    ),
    "finish-typing",
  );
  assert.equal(
    resolveGameplayDialogInputAction(direction("up"), 0, false),
    "advance",
  );
  assert.equal(
    resolveGameplayDialogInputAction(direction("up"), 2, false),
    "ignore",
  );
  assert.equal(
    resolveGameplayDialogInputAction(
      { type: "confirm", source: "keyboard" },
      2,
      false,
    ),
    "select",
  );
  assert.equal(
    resolveGameplayDialogInputAction(
      { type: "cancel", source: "keyboard" },
      2,
      false,
    ),
    "dismiss",
  );
});
