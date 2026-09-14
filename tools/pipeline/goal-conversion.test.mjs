import assert from "node:assert/strict";
import test from "node:test";
import {
  convertLegacyMapDocument,
  convertLegacyReplay,
  convertLegacyWinCondition,
} from "../model/convert-goals.mjs";

test("标准目标树保留 all 与 any 组合", () => {
  const source = {
    type: "all",
    conditions: [
      { type: "collect-all", target: "carrot" },
      {
        type: "any",
        conditions: [
          { type: "reach", target: "exit" },
          { type: "reach", target: "golden-carrot" },
        ],
      },
    ],
  };
  const converted = convertLegacyMapDocument({ rules: { win: source } });
  assert.deepEqual(converted.rules.win, {
    type: "all",
    conditions: [
      { type: "carrot" },
      { type: "any", conditions: [{ type: "exit" }, { type: "golden-carrot" }] },
    ],
  });
  assert.deepEqual(source.conditions[0], { type: "collect-all", target: "carrot" });
});

test("无法确定语义的条件报告准确路径", () => {
  assert.throws(
    () => convertLegacyWinCondition({
      type: "all",
      conditions: [{ type: "collect-all", target: "unknown" }],
    }),
    /rules\.win\.conditions\[0\]/,
  );
});

test("Replay 终态摘要显式转换", () => {
  const replay = convertLegacyReplay({
    finalState: {
      completedConditions: [
        { type: "fill-all", target: "egg-nest", filler: "filled-egg" },
        { type: "fill-all", target: "push-goal", filler: "pushable" },
      ],
    },
  });
  assert.deepEqual(replay.finalState.completedConditions, [
    { type: "egg" },
    { type: "push-goal" },
  ]);
});
