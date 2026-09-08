import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignLevelId,
  campaignLevelName,
} from "../public-ids.mjs";

test("Original Campaign 的路径 ID 与章节内展示名称分别生成", () => {
  assert.deepEqual(
    [1, 10, 11, 12].map((sourceLevelIndex) => ({
      id: campaignLevelId(7, sourceLevelIndex),
      name: campaignLevelName(sourceLevelIndex),
    })),
    [
      { id: "7-1", name: "1" },
      { id: "7-10", name: "10" },
      { id: "7-bonus-1", name: "BONUS 1" },
      { id: "7-bonus-2", name: "BONUS 2" },
    ],
  );
});
