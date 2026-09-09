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

test("Replay 从 tick 0 重放输入并验证最终 World 状态", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, level);
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
  assert.equal(replay.expectation.status, "won");
  assert.equal("snapshot" in replay, false);
  assert.equal("entities" in replay, false);
  assert.deepEqual(runReplay(level, replay), {
    passed: true,
    actual: {
      status: "won",
      moves: 1,
      stateHash: replay.expectation.stateHash,
      endTick: 3,
    },
    errors: [],
  });
});

test("ReplayPlayback 按记录输入播放并恢复宿主时钟状态", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, level);
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
  playback.setSpeed(0.1);
  assert.equal(session.clock.speed, 0.1);
  assert.equal(presentationClock.speed, 0.1);
  playback.setSpeed(12);
  assert.equal(playback.speed, 8);

  session.advanceTicks(playback.remainingTicks, (time) =>
    playback.inputForTick(time),
  );
  assert.equal(session.state.status, "won");
  assert.equal(session.state.moves, 1);
  assert.equal(playback.finishIfComplete(), true);
  assert.equal(playback.playing, false);
  assert.equal(session.clock.speed, 0.5);
  assert.equal(session.clock.paused, true);
  assert.equal(presentationClock.speed, 2);
  assert.equal(presentationClock.paused, true);

  const ticks = playback.jumpToEnd(replay);
  assert.equal(ticks.length, replay.endTick);
  assert.equal(session.state.status, "won");
  assert.equal(session.state.moves, 1);
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
  const recorder = new ReplayRecorder(session, level);
  const [tick] = session.advanceTicks(1, () => ({
    moves: [{ source: "external", direction: "right" }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.equal(tick.inputResolutions[0].result, "blocked");
  assert.equal(replay.frames[0].groups[0].intents[0].direction, "right");
  assert.equal(runReplay(level, replay).passed, true);
});

test("Replay 录制拒绝不可序列化的 Entity 初始化回调", () => {
  const level = carrotLevel();
  const session = new GameplaySession({ initializeEntityState: () => ({}) });
  session.loadLevel(level);
  assert.throws(
    () => new ReplayRecorder(session, level),
    /初始状态不能序列化/,
  );
});
