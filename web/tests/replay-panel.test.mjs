import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import {
  replayVerificationPresentation,
  validateBuiltinReplaySave,
} from "../src/pages/game/bindReplayPanel.ts";
import { replayPathId } from "../src/pages/game/replayAssets.ts";
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
        moves: 0,
        position: [{ x: 0, y: 0 }],
        elapsedMs: 34,
        counters: {},
        completedConditions: [],
      },
      endTick: 2,
    },
    {
      finalState: {
        status: "won",
      },
    },
  );

  assert.deepEqual(presentation, {
    text: "终局不一致 · 记录 won / 复跑 playing",
    failed: true,
  });
});

test("Replay 使用 collection 与地图 ID 组成路径身份", () => {
  assert.equal(replayPathId("original", "1-1"), "original/1-1");
});

test("Replay 未声明 status 时只报告复跑完成", () => {
  const presentation = replayVerificationPresentation(
    {
      actual: {
        status: "won",
        moves: 1,
        position: [{ x: 1, y: 0 }],
        elapsedMs: 100,
        counters: {},
        completedConditions: [],
      },
      endTick: 2,
    },
    { finalState: {} },
  );

  assert.deepEqual(presentation, {
    text: "复跑完成 · 2 ticks",
    failed: false,
  });
});

test("阻塞对话终止录制时清空 take 并显示诊断", () => {
  assert.match(replayBindingSource, /"replay-recording-aborted"/);
  assert.match(replayBindingSource, /replay = null;\s+output\.value = ""/);
  assert.match(
    replayBindingSource,
    /interactive host choice is not supported by replay/,
  );
  assert.match(replayBindingSource, /unsubscribeRecordingAbort\(\)/);
});

test("Replay 面板使用一帧一行的统一序列化", () => {
  assert.match(replayBindingSource, /output\.value = serializeReplay\(replay\)/);
});

test("关卡通关后自动结束 Replay 录制", () => {
  assert.match(
    replayBindingSource,
    /options\.game\.on\(\s*"level-complete",\s*stopRecording/,
  );
  assert.match(replayBindingSource, /unsubscribeLevelComplete\(\)/);
});

test("Replay 面板在播放按钮上方提供跳过思考时间选项", () => {
  const checkboxIndex = replayPanelSource.indexOf("data-replay-skip-thinking");
  const playButtonIndex = replayPanelSource.indexOf('data-replay-action="play"');

  assert.notEqual(checkboxIndex, -1);
  assert.ok(checkboxIndex < playButtonIndex);
  assert.match(replayPanelSource, /webT\("game\.replay\.skipThinking"\)/);
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

test("开发模式在加载内置过法旁显示同路径保存按钮", () => {
  const loadIndex = replayPanelSource.indexOf('data-replay-action="load-builtin"');
  const saveIndex = replayPanelSource.indexOf('data-replay-action="save-builtin"');
  assert.ok(loadIndex > -1 && saveIndex > loadIndex);
  assert.match(replayPanelSource, /const canSaveBuiltin = import\.meta\.env\.DEV/);
  assert.match(replayPanelSource, /v-if="canSaveBuiltin"/);
  assert.match(replayBindingSource, /validateBuiltinReplaySave\(options\.game, selectedReplay\)/);
  assert.match(replayBindingSource, /saveReplayAsset\(builtinReplayUrl, output\.value\)/);
});

test("保存内置过法只要求声明与实际复跑终局均为 won", () => {
  const replay = { finalState: { status: "won" } };
  const report = {
    actual: { status: "won" },
    endTick: 12,
  };
  assert.equal(
    validateBuiltinReplaySave({ verifyReplay: () => report }, replay),
    report,
  );
  assert.throws(
    () => validateBuiltinReplaySave(
      { verifyReplay: () => report },
      { finalState: { status: "playing" } },
    ),
    /必须声明 won 终局/,
  );
  assert.throws(
    () => validateBuiltinReplaySave(
      {
        verifyReplay: () => ({
          actual: { status: "playing" },
          endTick: 12,
        }),
      },
      replay,
    ),
    /复跑后未通关/,
  );
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
