import assert from "node:assert/strict";
import { test } from "vitest";
import { replayVerificationPresentation } from "../src/pages/game/bindReplayPanel.ts";

test("Replay 面板提示复跑终局与记录不一致", () => {
  const presentation = replayVerificationPresentation(
    {
      actual: {
        status: "playing",
        moves: 1,
        endTick: 2,
      },
    },
    {
      meta: {
        final_status: "won",
      },
    },
  );

  assert.deepEqual(presentation, {
    text: "终局不一致 · 记录 won / 复跑 playing",
    failed: true,
  });
});
