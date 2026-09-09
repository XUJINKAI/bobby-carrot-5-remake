import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { GameplaySession } from "../dist/core/GameplaySession.js";
import { ReplayPlayback } from "../dist/replay/ReplayPlayback.js";
import { ReplayRecorder } from "../dist/replay/ReplayRecorder.js";
import { runReplay } from "../dist/replay/ReplayRunner.js";
import { PresentationClock } from "../dist/time/PresentationClock.js";

const ground = (x) => ({ type: "grass", variant: "ts-10-1", x, y: 0 });

function carrotLevel() {
  return {
    schemaVersion: 1,
    width: 3,
    height: 1,
    rules: { win: { type: "collect-all", target: MapEntityTypeId.CARROT } },
    entities: [
      ground(0),
      ground(1),
      ground(2),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
    ],
  };
}

test("GameplaySession 固定在 World Tick 末尾执行玩家语义输入", () => {
  const session = new GameplaySession({
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel(carrotLevel());
  const [first] = session.advanceTicks(1, () => ({
    moves: [{ source: "external", direction: "right" }],
  }));

  assert.equal(first.time.tick, 0);
  assert.equal(first.inputGroups.length, 1);
  assert.equal(first.inputResolutions[0].result, "moved");
  assert.equal(session.state.status, "playing");

  session.advanceTicks(2);
  assert.equal(session.state.status, "won");
  assert.equal(session.state.moves, 1);
});

test("Replay 从 tick 0 重放输入并报告最终 World 状态", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    name: "测试胡萝卜",
    url: "/test/carrot",
  });
  for (const tick of session.advanceTicks(3, (time) =>
    time.tick === 0
      ? { moves: [{ source: "external", direction: "right" }] }
      : {},
  ))
    recorder.record(tick);
  const replay = recorder.stop();

  assert.equal(replay.frames.length, 1);
  assert.equal(replay.frames[0].tick, 0);
  assert.equal(replay.endTick, 3);
  assert.deepEqual(replay.meta, {
    name: "测试胡萝卜",
    url: "/test/carrot",
    final_status: "won",
    note: "",
  });
  assert.deepEqual(Object.keys(replay.runtime), ["worldHz", "bobbyLocomotion"]);
  assert.equal(Object.keys(replay).at(-1), "frames");
  assert.equal("levelHash" in replay, false);
  assert.equal("expectation" in replay, false);
  assert.equal("snapshot" in replay, false);
  assert.equal("entities" in replay, false);
  assert.deepEqual(runReplay(level, replay), {
    actual: {
      status: "won",
      moves: 1,
      endTick: 3,
    },
  });
});

test("ReplayPlayback 按记录输入播放并保留 Engine 速率", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    name: "测试胡萝卜",
    url: "/test/carrot",
  });
  for (const tick of session.advanceTicks(3, (time) =>
    time.tick === 0
      ? { moves: [{ source: "external", direction: "right" }] }
      : {},
  ))
    recorder.record(tick);
  const replay = recorder.stop();
  const presentationClock = new PresentationClock();
  const playback = new ReplayPlayback(session, presentationClock);

  session.clock.setSpeed(0.5);
  session.clock.pause();
  presentationClock.setSpeed(2);
  presentationClock.pause();
  playback.start(replay);

  assert.equal(playback.playing, true);
  assert.equal(session.clock.tickCount, 0);
  assert.equal(session.clock.paused, false);
  assert.equal(presentationClock.paused, false);
  assert.equal(session.clock.speed, 0.5);
  assert.equal(presentationClock.speed, 2);
  playback.pause();
  assert.equal(playback.paused, true);
  assert.equal(session.clock.paused, true);
  assert.equal(presentationClock.paused, true);
  playback.resume();
  assert.equal(playback.paused, false);
  session.clock.setSpeed(20);
  presentationClock.setSpeed(20);

  session.advanceTicks(playback.remainingTicks, (time) =>
    playback.inputForTick(time),
  );
  assert.equal(session.state.status, "won");
  assert.equal(session.state.moves, 1);
  assert.equal(playback.finishIfComplete(), true);
  assert.equal(playback.playing, false);
  assert.equal(session.clock.speed, 20);
  assert.equal(session.clock.paused, true);
  assert.equal(presentationClock.speed, 20);
  assert.equal(presentationClock.paused, true);

  const ticks = playback.jumpToEnd(replay);
  assert.equal(ticks.length, replay.endTick);
  assert.equal(session.state.status, "won");
  assert.equal(session.state.moves, 1);
});

test("ReplayPlayback 只压缩长无输入区间并保留下次输入", () => {
  const level = {
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [ground(0), { type: MapEntityTypeId.BOBBY, x: 0, y: 0 }],
  };
  const recordingSession = new GameplaySession({ timing: { worldHz: 20 } });
  recordingSession.loadLevel(level);
  const recorder = new ReplayRecorder(recordingSession, {
    name: "长无输入区间",
    url: "/test/idle-gap",
  });
  for (const tick of recordingSession.advanceTicks(100, (time) =>
    time.tick === 0 || time.tick === 80
      ? { moves: [{ source: "external", direction: "right" }] }
      : {},
  ))
    recorder.record(tick);
  const replay = recorder.stop();
  const session = new GameplaySession({ timing: { worldHz: 20 } });
  session.loadLevel(level);
  const playback = new ReplayPlayback(session, new PresentationClock());

  playback.start(replay);
  session.advanceTicks(1, (time) => playback.inputForTick(time));
  assert.equal(playback.advanceIdleTicks(128, () => true), 0);

  playback.start(replay, { skipIdleTime: true });
  session.advanceTicks(1, (time) => playback.inputForTick(time));
  const skippedTicks = [];
  assert.equal(
    playback.advanceIdleTicks(128, (tick) => {
      skippedTicks.push(tick.time.tick);
      return true;
    }),
    74,
  );
  assert.deepEqual(skippedTicks, Array.from({ length: 74 }, (_, index) => index + 1));
  assert.equal(session.clock.tickCount, 75);

  const tail = session.advanceTicks(6, (time) => playback.inputForTick(time));
  assert.equal(tail.at(-1).time.tick, 80);
  assert.equal(tail.at(-1).inputGroups.length, 1);
});

test("Replay 保留受阻的玩家输入尝试", () => {
  const level = {
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [ground(0), { type: MapEntityTypeId.BOBBY, x: 0, y: 0 }],
  };
  const session = new GameplaySession();
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    name: "受阻输入",
    url: "/test/blocked-input",
  });
  const [tick] = session.advanceTicks(1, () => ({
    moves: [{ source: "external", direction: "right" }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.equal(tick.inputResolutions[0].result, "blocked");
  assert.equal(replay.frames[0].groups[0].intents[0].direction, "right");
  assert.equal(runReplay(level, replay).actual.endTick, replay.endTick);
});

test("ReplayRunner 拒绝不符合播放合同的输入", () => {
  const replay = {
    formatVersion: 2,
    meta: {
      name: "错误版本",
      url: "/test/invalid-version",
      final_status: "playing",
      note: "",
    },
    runtime: {
      worldHz: 20,
      bobbyLocomotion: { moveMs: 100, speedShoesScale: 0.76 },
    },
    endTick: 0,
    frames: [],
  };
  assert.throws(() => runReplay(carrotLevel(), replay), /formatVersion 2/);
});

test("Replay Bobby 运动参数按字段值校验，不依赖 JSON 属性顺序", () => {
  const replay = {
    formatVersion: 1,
    meta: {
      name: "属性顺序",
      url: "/test/property-order",
      final_status: "playing",
      note: "",
    },
    runtime: {
      worldHz: 20,
      bobbyLocomotion: {
        speedShoesScale: 0.76,
        moveMs: 100,
      },
    },
    endTick: 0,
    frames: [],
  };

  assert.equal(runReplay(carrotLevel(), replay).actual.status, "playing");
});

test("Replay 录制拒绝不可序列化的 Entity 初始化回调", () => {
  const level = carrotLevel();
  const session = new GameplaySession({ initializeEntityState: () => ({}) });
  session.loadLevel(level);
  assert.throws(
    () => new ReplayRecorder(session, { name: "测试", url: "/test" }),
    /初始状态不能序列化/,
  );
});
