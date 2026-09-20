import assert from "node:assert/strict";
import test from "node:test";
import {
  convertLegacyMapDocument,
  convertLegacyReplay,
  convertLegacyWinCondition,
} from "../../../tools/model/convert-goals.mjs";

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

test("标准目标按字段匹配，字段顺序不影响转换且多余字段报错", () => {
  const conditions = [
    [{ target: "carrot", type: "collect-all" }, "carrot"],
    [{ filler: "filled-egg", target: "egg-nest", type: "fill-all" }, "egg"],
    [{ filler: "pushable", type: "fill-all", target: "push-goal" }, "push-goal"],
    [{ target: "exit", type: "reach" }, "exit"],
    [{ target: "golden-carrot", type: "reach" }, "golden-carrot"],
  ];
  for (const [condition, type] of conditions)
    assert.deepEqual(convertLegacyWinCondition(condition), { type });

  assert.throws(
    () => convertLegacyWinCondition({ target: "carrot", type: "collect-all", extra: true }),
    /rules\.win: 无法确定目标语义/,
  );
  assert.throws(
    () => convertLegacyWinCondition({ target: "egg-nest", type: "fill-all" }),
    /rules\.win: 无法确定目标语义/,
  );
  assert.throws(
    () => convertLegacyWinCondition({ type: "all", conditions: [
      { type: "reach", target: "exit" },
    ], extra: true }),
    /rules\.win: 无法确定目标语义/,
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
