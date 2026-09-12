import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { GameplaySession } from "../dist/core/GameplaySession.js";
import { ReplayPlayback } from "../dist/replay/ReplayPlayback.js";
import { ReplayRecorder } from "../dist/replay/ReplayRecorder.js";
import { replayVerificationStates } from "../dist/replay/ReplayFinalState.js";
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

function assertReplayMatches(level, replay, endTick) {
  const report = runReplay(level, replay);
  assert.equal(report.endTick, endTick);
  const verification = replayVerificationStates(
    report.actual,
    replay.finalState,
  );
  assert.deepEqual(verification.actual, verification.expected);
  return report;
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
  assert.throws(
    () => new ReplayRecorder(session, { id: "carrot", url: "/test/carrot" }),
    /Replay meta\.id 必须使用/,
  );
  const recorder = new ReplayRecorder(session, {
    id: "test/carrot",
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
    id: "test/carrot",
    url: "/test/carrot",
    note: "",
  });
  assert.deepEqual(Object.keys(replay.runtime), ["worldHz", "bobbyLocomotion"]);
  assert.deepEqual(replay.initialIntents, []);
  assert.equal(Object.keys(replay).at(-1), "frames");
  assert.equal("levelHash" in replay, false);
  assert.deepEqual(replay.finalState, {
    status: "won",
    moves: 1,
    elapsedMs: 150,
    counters: { "collect-carrot": 1 },
    completedConditions: [{ type: "collect-all", target: "carrot" }],
  });
  assert.equal("snapshot" in replay, false);
  assert.equal("entities" in replay, false);
  const invalidPathId = structuredClone(replay);
  invalidPathId.meta.id = "carrot";
  assert.throws(
    () => runReplay(level, invalidPathId),
    /Replay meta\.id 必须使用/,
  );
  const mapMetadataShape = structuredClone(replay);
  mapMetadataShape.meta = {
    name: "测试胡萝卜",
    url: "/test/carrot",
    note: "",
  };
  assert.throws(() => runReplay(level, mapMetadataShape), /Replay meta 无效/);
  const report = assertReplayMatches(level, replay, 3);
  assert.deepEqual(
    replayVerificationStates(report.actual, { elapsedMs: 999_999 }),
    { actual: {}, expected: {} },
  );
  assert.deepEqual(
    replayVerificationStates(report.actual, {}),
    { actual: {}, expected: {} },
  );
  assert.deepEqual(
    replayVerificationStates(report.actual, { moves: 1 }),
    { actual: { moves: 1 }, expected: { moves: 1 } },
  );
  const replayWithoutAssertions = structuredClone(replay);
  replayWithoutAssertions.finalState = {};
  assert.equal(runReplay(level, replayWithoutAssertions).actual.status, "won");

  for (const field of ["actorId", "source"]) {
    const invalid = structuredClone(replay);
    invalid.frames[0].groups[0].intents[0][field] = field === "actorId"
      ? 4
      : "arrows";
    assert.throws(() => runReplay(level, invalid), /未声明字段/);
  }
});

test("Replay 只保存实际生效的持续移动输入", () => {
  const level = {
    schemaVersion: 1,
    width: 10,
    height: 1,
    entities: [
      ...Array.from({ length: 10 }, (_, x) => ground(x)),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    ],
  };
  const session = new GameplaySession({
    timing: { worldHz: 60 },
    bobbyLocomotion: { moveMs: 350 },
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/held-movement",
    url: "/test/held-movement",
  });
  for (const tick of session.advanceTicks(180, () => ({
    moves: [{ source: "external", direction: "right" }],
  })))
    recorder.record(tick);
  const replay = recorder.stop();

  assert.equal(replay.frames.length, session.state.moves);
  assert.equal(replay.frames.length, 9);
  assert.equal(runReplay(level, replay).endTick, replay.endTick);
});

test("Replay 不重复记录可由对话 choice 重建的 Entity replacement", () => {
  const level = {
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.LOCK_KEY, x: 1, y: 0 },
    ],
  };
  const session = new GameplaySession();
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/shop-purchase",
    url: "/test/shop-purchase",
  });
  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      historyBoundary: false,
      recordInReplay: false,
      intents: [{
        type: "commit-entity-replacement",
        target: {
          type: MapEntityTypeId.LOCK_KEY,
          x: 1,
          y: 0,
        },
        replacementType: MapEntityTypeId.SHOP_EMPTY,
      }],
    }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.deepEqual(replay.frames, []);
  assert.equal(runReplay(level, replay).actual.status, "playing");
});

test("Replay frame 使用一基 choices 记录同一 Tick 的多轮选择", () => {
  const session = new GameplaySession();
  session.loadLevel(carrotLevel());
  const recorder = new ReplayRecorder(session, {
    id: "test/dialog-choices",
    url: "/test/dialog-choices",
  });
  const [tick] = session.advanceTicks(1);
  recorder.record(tick);
  recorder.recordChoice(0, 1);
  recorder.recordChoice(0, 3);
  const replay = recorder.stop();

  assert.deepEqual(replay.frames, [{
    tick: 0,
    groups: [],
    choices: [1, 3],
  }]);

  const playbackSession = new GameplaySession();
  playbackSession.loadLevel(carrotLevel());
  const playback = new ReplayPlayback(
    playbackSession,
    new PresentationClock(),
  );
  playback.start(replay);
  playback.prepareChoices(0);
  assert.equal(playback.consumeChoice(2), 1);
  assert.equal(playback.consumeChoice(4), 3);
  assert.equal(playback.finishIfComplete(), false);

  playback.start(replay);
  playback.prepareChoices(0);
  assert.equal(playback.consumeChoice(2), 1);
  assert.throws(() => playback.prepareChoices(1), /未消费的对话 choices/);

  playback.start(replay);
  playback.prepareChoices(0);
  assert.equal(playback.consumeChoice(2), 1);
  assert.throws(() => playback.consumeChoice(2), /超出 2 个选项/);

  const withoutChoice = structuredClone(replay);
  delete withoutChoice.frames[0].choices;
  playback.start(withoutChoice);
  playback.prepareChoices(0);
  assert.throws(() => playback.consumeChoice(2), /缺少对话 choice/);

  const invalid = structuredClone(replay);
  invalid.frames[0].choices = [];
  assert.throws(
    () => runReplay(carrotLevel(), invalid),
    /choices 必须是非空正整数数组/,
  );
  assert.throws(
    () => playback.jumpToEnd(replay),
    /需要按时间线播放/,
  );
});

test("ReplayPlayback 按记录输入播放并保留 Engine 速率", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/carrot",
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
    width: 3,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
    ],
  };
  const recordingSession = new GameplaySession({ timing: { worldHz: 20 } });
  recordingSession.loadLevel(level);
  const recorder = new ReplayRecorder(recordingSession, {
    id: "test/idle-gap",
    url: "/test/idle-gap",
  });
  for (const tick of recordingSession.advanceTicks(100, (time) =>
    time.tick === 0 || time.tick === 80
      ? {
          moves: [{
            source: "external",
            direction: time.tick === 0 ? "right" : "left",
          }],
        }
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

test("Replay 省略没有 gameplay 效果的受阻输入", () => {
  const level = {
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [ground(0), { type: MapEntityTypeId.BOBBY, x: 0, y: 0 }],
  };
  const session = new GameplaySession();
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/blocked-input",
    url: "/test/blocked-input",
  });
  const [tick] = session.advanceTicks(1, () => ({
    moves: [{ source: "external", direction: "right" }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.equal(tick.inputResolutions[0].result, "blocked");
  assert.deepEqual(replay.frames, []);
  assert.equal(runReplay(level, replay).endTick, replay.endTick);
});

test("Replay 保留 RuntimeAction 实际观察到的移动输入", () => {
  const level = {
    schemaVersion: 1,
    width: 10,
    height: 1,
    entities: [
      ...Array.from({ length: 10 }, (_, x) => ground(x)),
      { type: MapEntityTypeId.SPEED, x: 1, y: 0, direction: "right" },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    ],
  };
  const options = {
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  };
  const session = new GameplaySession(options);
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/speed-observation",
    url: "/test/speed-observation",
  });
  for (const tick of session.advanceTicks(40, () => ({
    moves: [{ source: "external", direction: "right" }],
  })))
    recorder.record(tick);
  const replay = recorder.stop();
  const replayed = new GameplaySession(options);
  replayed.loadLevel(level);
  const playback = new ReplayPlayback(replayed, new PresentationClock());
  playback.start(replay);
  replayed.advanceTicks(replay.endTick, (time) => playback.inputForTick(time));

  assert.ok(replay.frames.length < replay.endTick / 2);
  assert.deepEqual(replayed.state.player, session.state.player);
  assert.equal(replayed.state.moves, session.state.moves);
});

test("ReplayRunner 拒绝不符合播放合同的输入", () => {
  const replay = {
    formatVersion: 2,
    meta: {
      id: "test/invalid-version",
      url: "/test/invalid-version",
      note: "",
    },
    runtime: {
      worldHz: 20,
      bobbyLocomotion: { moveMs: 100 },
    },
    initialIntents: [],
    finalState: {
      status: "playing",
      counters: {},
      completedConditions: [],
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
      id: "test/property-order",
      url: "/test/property-order",
      note: "",
    },
    runtime: {
      worldHz: 20,
      bobbyLocomotion: {
        moveMs: 100,
      },
    },
    initialIntents: [],
    finalState: {
      status: "playing",
      moves: 0,
      elapsedMs: 0,
      counters: {},
      completedConditions: [],
    },
    endTick: 0,
    frames: [],
  };

  assert.equal(runReplay(carrotLevel(), replay).actual.status, "playing");
});

test("Replay 保存从通用 actor target 解析出的初始动作", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    initialActorIntents: [
      {
        type: "set-actor-locomotion",
        actor: "all",
        moveDurationMs: 266,
      },
    ],
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/initial-locomotion",
    url: "/test",
  });
  const replay = recorder.stop();

  assert.deepEqual(replay.initialIntents, [
    {
      type: "set-actor-locomotion",
      moveDurationMs: 266,
    },
  ]);
  assert.equal(session.state.actors[0].moveDurationMs, 266);
  assert.equal(runReplay(level, replay).actual.status, "playing");
});

test("运行中的 locomotion 动作进入 Replay frame", () => {
  const session = new GameplaySession({ bobbyLocomotion: { moveMs: 350 } });
  session.loadLevel(carrotLevel());
  const recorder = new ReplayRecorder(session, {
    id: "test/dynamic-locomotion",
    url: "/test",
  });
  const actorId = session.state.primaryActorId;
  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      intents: [{
        type: "set-actor-locomotion",
        actorId,
        moveDurationMs: 266,
      }],
    }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.equal(session.state.actors[0].moveDurationMs, 266);
  assert.deepEqual(replay.frames[0].groups[0].intents[0], {
    type: "set-actor-locomotion",
    moveDurationMs: 266,
  });
});

test("Replay 只保留关卡内道具动作的 gameplay 字段", () => {
  const session = new GameplaySession();
  session.loadLevel(carrotLevel());
  const recorder = new ReplayRecorder(session, {
    id: "test/key-interaction",
    url: "/test",
  });
  const actorId = session.state.primaryActorId;
  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      intents: [{
        type: "add-actor-inventory-item",
        actorId,
        item: "lock-key",
        count: 1,
        requestId: 42,
      }],
    }],
  }));
  recorder.record(tick);

  assert.deepEqual(recorder.stop().frames[0].groups[0].intents[0], {
    type: "add-actor-inventory-item",
    item: "lock-key",
    count: 1,
  });
});

test("Replay 初始道具动作也省略交互关联字段", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    initialIntents: [{
      type: "add-actor-inventory-item",
      actorId: 4,
      item: "lock-key",
      count: 2,
      requestId: 7,
    }],
  });
  session.loadLevel(level);
  const replay = new ReplayRecorder(session, {
    id: "test/initial-key-fields",
    url: "/test",
  }).stop();

  assert.deepEqual(replay.initialIntents, [{
    type: "add-actor-inventory-item",
    item: "lock-key",
    count: 2,
  }]);
});

test("Replay 使用数字 channel 表达多 Bobby 控制输入", () => {
  const level = {
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      ground(3),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, controller: 0 },
      { type: MapEntityTypeId.BOBBY, x: 3, y: 0, controller: 1 },
    ],
  };
  const session = new GameplaySession();
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    id: "test/two-channels",
    url: "/test/two-channels",
  });
  const [first, second] = session.advanceTicks(2, (time) => ({
    moves: [{
      source: time.tick === 0 ? "external" : "wasd",
      direction: time.tick === 0 ? "right" : "left",
    }],
  }));
  recorder.record(first);
  recorder.record(second);
  const replay = recorder.stop();

  assert.deepEqual(replay.frames.map((frame) => frame.groups[0].intents[0]), [
    { type: "move", direction: "right" },
    { type: "move", direction: "left", channel: 1 },
  ]);
  assertReplayMatches(level, replay, 2);
});

test("多 Bobby 的 actor 动作使用动作时位置", () => {
  const level = {
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      ground(3),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, controller: 0 },
      { type: MapEntityTypeId.BOBBY, x: 3, y: 0, controller: 1 },
    ],
  };
  const session = new GameplaySession();
  session.loadLevel(level);
  const secondActorId = session.actorIds[1];
  const recorder = new ReplayRecorder(session, {
    id: "test/actor-position",
    url: "/test/actor-position",
  });
  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      intents: [{
        type: "set-actor-locomotion",
        actorId: secondActorId,
        moveDurationMs: 240,
      }],
    }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.deepEqual(replay.frames[0].groups[0].intents[0], {
    type: "set-actor-locomotion",
    actor: { x: 3, y: 0 },
    moveDurationMs: 240,
  });
  assertReplayMatches(level, replay, 1);
});

test("绕过 controller 的调试移动使用移动前的 actor 位置", () => {
  const level = {
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      ground(3),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, controller: 0 },
      { type: MapEntityTypeId.BOBBY, x: 3, y: 0, controller: 1 },
    ],
  };
  const session = new GameplaySession();
  session.loadLevel(level);
  const secondActorId = session.actorIds[1];
  const recorder = new ReplayRecorder(session, {
    id: "test/direct-actor-move",
    url: "/test/direct-actor-move",
  });
  const [tick] = session.advanceTicks(1, () => ({
    actorMoves: [{
      source: "external",
      actorId: secondActorId,
      direction: "left",
    }],
  }));
  recorder.record(tick);
  const replay = recorder.stop();

  assert.deepEqual(replay.frames[0].groups[0].intents[0], {
    type: "move",
    direction: "left",
    actor: { x: 3, y: 0 },
  });
  assertReplayMatches(level, replay, 1);
});
