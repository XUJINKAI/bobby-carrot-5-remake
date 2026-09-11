import assert from "node:assert/strict";
import test from "node:test";
import { cycleOptionIndex } from "../dist/ui/GameplayDialog.js";

test("Gameplay Dialog 左右选择在任意数量选项间循环", () => {
  assert.equal(cycleOptionIndex(0, 5, 1), 1);
  assert.equal(cycleOptionIndex(4, 5, 1), 0);
  assert.equal(cycleOptionIndex(0, 5, -1), 4);
  assert.equal(cycleOptionIndex(2, 0, 1), -1);
});
