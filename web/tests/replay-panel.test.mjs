import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { replayVerificationPresentation } from "../src/pages/game/bindReplayPanel.ts";
import {
  loadReplayPanelOpen,
  storeReplayPanelOpen,
} from "../src/pages/game/replayPanelState.ts";

const replayPanelSource = fs.readFileSync(
  new URL("../src/pages/game/ReplayPanel.vue", import.meta.url),
  "utf8",
);
const replayBindingSource = fs.readFileSync(
  new URL("../src/pages/game/bindReplayPanel.ts", import.meta.url),
  "utf8",
);

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

test("Replay 面板在播放按钮上方提供跳过思考时间选项", () => {
  const checkboxIndex = replayPanelSource.indexOf("data-replay-skip-thinking");
  const playButtonIndex = replayPanelSource.indexOf('data-replay-action="play"');

  assert.notEqual(checkboxIndex, -1);
  assert.ok(checkboxIndex < playButtonIndex);
  assert.match(replayPanelSource, /<span>跳过思考时间<\/span>/);
  assert.match(replayBindingSource, /skipIdleTime: skipThinking\.checked/);
});

test("Replay 面板开关状态在当前标签页中持久化", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(loadReplayPanelOpen(storage), false);
  storeReplayPanelOpen(true, storage);
  assert.equal(loadReplayPanelOpen(storage), true);
  storeReplayPanelOpen(false, storage);
  assert.equal(loadReplayPanelOpen(storage), false);
});

test("Replay 面板可按游戏来源隐藏内置过法入口", () => {
  assert.match(
    replayPanelSource,
    /v-if="showBuiltin"[\s\S]*data-replay-action="load-builtin"/,
  );
  assert.match(replayBindingSource, /builtinReplayUrl\?: string/);
  assert.match(replayBindingSource, /if \(!builtinReplayUrl\) return/);
});

test("Replay 起点与终点跳转按钮显示对应方向的回转图标", () => {
  assert.match(
    replayPanelSource,
    /<AppIcon name="replay-beginning" :size="16" \/>/,
  );
  assert.match(
    replayPanelSource,
    /<AppIcon name="replay-end" :size="16" \/>/,
  );
});
