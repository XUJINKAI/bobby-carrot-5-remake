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
    note: "",
  });
  assert.deepEqual(Object.keys(replay.runtime), ["worldHz", "bobbyLocomotion"]);
  assert.deepEqual(replay.initialIntents, []);
  assert.equal(Object.keys(replay).at(-1), "frames");
  assert.equal("levelHash" in replay, false);
  assert.deepEqual(replay.finalState, {
    status: "won",
    counters: { "collect-carrot": 1 },
    completedConditions: [{ type: "collect-all", target: "carrot" }],
  });
  assert.equal("snapshot" in replay, false);
  assert.equal("entities" in replay, false);
  assert.deepEqual(runReplay(level, replay), {
    actual: replay.finalState,
    endTick: 3,
  });

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
    name: "持续移动",
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
    name: "长无输入区间",
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
    name: "受阻输入",
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
    name: "Speed 输入观察",
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
      name: "错误版本",
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
      name: "属性顺序",
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
        type: "set-actor-lock-key",
        actor: "all",
        kind: "reusable",
        enabled: true,
      },
    ],
  });
  session.loadLevel(level);
  const recorder = new ReplayRecorder(session, {
    name: "初始钥匙",
    url: "/test",
  });
  const replay = recorder.stop();

  assert.deepEqual(replay.initialIntents, [
    {
      type: "set-actor-lock-key",
      kind: "reusable",
      enabled: true,
    },
  ]);
  assert.equal(session.state.inventory.reusableLockKey, true);
  assert.equal(runReplay(level, replay).actual.status, "playing");
});

test("运行中的 locomotion 动作进入 Replay frame", () => {
  const session = new GameplaySession({ bobbyLocomotion: { moveMs: 350 } });
  session.loadLevel(carrotLevel());
  const recorder = new ReplayRecorder(session, {
    name: "动态移动速度",
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

test("Replay 只保留钥匙动作的 gameplay 字段", () => {
  const session = new GameplaySession();
  session.loadLevel(carrotLevel());
  const recorder = new ReplayRecorder(session, {
    name: "钥匙交互",
    url: "/test",
  });
  const actorId = session.state.primaryActorId;
  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      intents: [{
        type: "set-actor-lock-key",
        actorId,
        kind: "single-use",
        enabled: true,
        requestId: 42,
      }],
    }],
  }));
  recorder.record(tick);

  assert.deepEqual(recorder.stop().frames[0].groups[0].intents[0], {
    type: "set-actor-lock-key",
    kind: "single-use",
    enabled: true,
  });
});

test("Replay 初始钥匙动作也省略交互关联字段", () => {
  const level = carrotLevel();
  const session = new GameplaySession({
    initialIntents: [{
      type: "set-actor-lock-key",
      actorId: 4,
      kind: "reusable",
      enabled: true,
      requestId: 7,
    }],
  });
  session.loadLevel(level);
  const replay = new ReplayRecorder(session, {
    name: "初始钥匙字段",
    url: "/test",
  }).stop();

  assert.deepEqual(replay.initialIntents, [{
    type: "set-actor-lock-key",
    kind: "reusable",
    enabled: true,
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
    name: "双通道",
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
  assert.deepEqual(runReplay(level, replay), {
    actual: replay.finalState,
    endTick: 2,
  });
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
    name: "位置引用",
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
  assert.deepEqual(runReplay(level, replay), {
    actual: replay.finalState,
    endTick: 1,
  });
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
    name: "调试移动",
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
  assert.deepEqual(runReplay(level, replay), {
    actual: replay.finalState,
    endTick: 1,
  });
});
