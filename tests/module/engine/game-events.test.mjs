import assert from "node:assert/strict";
import test from "node:test";
import { Game } from "../../../engine/dist/core/Game.js";
import { WorldEventDispatcher } from "../../../engine/dist/core/WorldEventDispatcher.js";

const interaction = {
  type: "object-interaction",
  actorId: 1,
  entityId: 2,
  requestId: 3,
  objectType: "beaver",
  x: 4,
  y: 5,
  action: "touch",
};

function eventGame(replayPlaying) {
  const game = Object.create(Game.prototype);
  game.replayPlayback = { playing: replayPlaying };
  game.worldEvents = new WorldEventDispatcher();
  game.presentation = { shakeStepped() {} };
  game.tuning = {
    impactShake: {
      stageMs: 26,
      stages: 8,
      initialSpanSourcePx: 42,
    },
  };
  game.dialog = null;
  return game;
}

test("live session 同时发布世界事件与外部交互请求", () => {
  const game = eventGame(false);
  const worldEvents = [];
  const requests = [];
  game.onWorldEvent((event) => worldEvents.push(event));
  game.onInteractionRequest((event) => requests.push(event));

  game.publishWorldEvents([interaction]);

  assert.deepEqual(worldEvents, [interaction]);
  assert.deepEqual(requests, [interaction]);
});

test("地图字面对白由 Engine 消费且不会传播给宿主", () => {
  const game = eventGame(false);
  const worldEvents = [];
  const requests = [];
  const dialogues = [];
  game.dialog = {
    handleEntityDialogue(event) {
      dialogues.push(event);
    },
  };
  game.onWorldEvent((event) => worldEvents.push(event));
  game.onInteractionRequest((event) => requests.push(event));
  const dialogue = {
    type: "dialogue-request",
    actorId: 1,
    entityId: 2,
    objectType: "beaver",
    role: "body",
    x: 4,
    y: 5,
    action: "touch",
    lines: ["第一句", "第二句"],
  };

  game.publishWorldEvents([dialogue]);

  assert.deepEqual(dialogues, [dialogue]);
  assert.deepEqual(worldEvents, []);
  assert.deepEqual(requests, []);
});

test("Replay 不显示也不传播地图字面对白", () => {
  const game = eventGame(true);
  const dialogues = [];
  game.dialog = { handleEntityDialogue: (event) => dialogues.push(event) };

  game.publishWorldEvents([{
    type: "dialogue-request",
    actorId: 1,
    entityId: 2,
    objectType: "beaver",
    x: 4,
    y: 5,
    action: "touch",
    lines: ["对白"],
  }]);

  assert.deepEqual(dialogues, []);
});

test("Replay playback 只发布可观察的世界事件", () => {
  const game = eventGame(true);
  const worldEvents = [];
  const requests = [];
  game.onWorldEvent((event) => worldEvents.push(event));
  game.onInteractionRequest((event) => requests.push(event));

  game.publishWorldEvents([interaction]);

  assert.deepEqual(worldEvents, [interaction]);
  assert.deepEqual(requests, []);
});

test("宿主阻塞交互会终止录制并发布通知", () => {
  const game = eventGame(false);
  game.listeners = new Map();
  game.replayRecorder = {};
  const notifications = [];
  game.on("replay-recording-aborted", () => notifications.push("aborted"));
  game.on("change", () => notifications.push("change"));

  game.abortReplayRecording();

  assert.equal(game.replayRecording, false);
  assert.deepEqual(notifications, ["aborted", "change"]);
  game.abortReplayRecording();
  assert.deepEqual(notifications, ["aborted", "change"]);
});

test("非移动 gameplay intent 会在排队前终止 Replay 录制", () => {
  const game = eventGame(false);
  game.listeners = new Map();
  game.replayRecorder = {};
  game.session = {
    hasLevel: true,
    world: { dead: false, completed: false },
  };
  game.queuedEffectIntentGroups = [];
  const notifications = [];
  game.on("replay-recording-aborted", () => notifications.push("aborted"));

  game.dispatch({
    type: "set-actor-locomotion",
    actorId: 1,
    moveDurationMs: 266,
  });

  assert.equal(game.replayRecording, false);
  assert.deepEqual(notifications, ["aborted"]);
  assert.equal(game.queuedEffectIntentGroups.length, 1);
});

test("对话门禁清除移动输入并保留已排队的 gameplay effect", () => {
  const game = eventGame(false);
  let movementSuspended = 0;
  game.session = {
    hasLevel: true,
    world: { dead: false, completed: false },
  };
  game.presentation = {
    setDialogueActive() {},
  };
  game.inputController = {
    suspendMovement() {
      movementSuspended += 1;
    },
  };
  game.heldDirection = "right";
  game.heldDirectionBlocked = true;
  game.queuedMoves = [{ source: "keyboard", direction: "right" }];
  game.queuedEffectIntentGroups = [];
  game.dialogueBlockCount = 0;
  game.dispatchInteractionEffect({
    type: "add-actor-inventory-item",
    actorId: 1,
    item: "lock-key",
    count: 1,
    requestId: 7,
  });

  const lease = game.acquireDialogueBlock();

  assert.equal(game.heldDirection, null);
  assert.equal(game.heldDirectionBlocked, false);
  assert.deepEqual(game.queuedMoves, []);
  assert.equal(game.queuedEffectIntentGroups.length, 1);
  assert.deepEqual(game.queuedEffectIntentGroups[0].intents, [{
    type: "add-actor-inventory-item",
    actorId: 1,
    item: "lock-key",
    count: 1,
    requestId: 7,
  }]);
  assert.equal(movementSuspended, 1);
  lease.release();
});

test("Replay 跳转终点仍按顺序发布沿途 WorldEvent", () => {
  const game = eventGame(false);
  const collected = { type: "collect-bonus-coin" };
  const events = [];
  game.onWorldEvent((event) => events.push(event));
  game.replayPlayback.jumpToEnd = () => [{
    result: { moves: [], events: [collected] },
  }];
  game.resetSessionView = () => {};
  game.render = () => {};
  game.emitTerminalEvents = () => {};
  game.emit = () => {};

  game.jumpReplayToEnd({ frames: [] });

  assert.deepEqual(events, [collected]);
});

test("Game 在发布终局事件时同步 Engine 音乐状态", () => {
  const game = eventGame(false);
  const outcomes = [];
  const events = [];
  game.session = {
    hasLevel: true,
    world: { dead: false, completed: true },
  };
  game.music = { setOutcome: (outcome) => outcomes.push(outcome) };
  game.listeners = new Map([
    ["level-complete", new Set([() => events.push("level-complete")])],
  ]);

  game.emitTerminalEvents();

  assert.deepEqual(outcomes, ["won"]);
  assert.deepEqual(events, ["level-complete"]);
});

test("Speed、Flight Landing 与 Mower 冲撞共用原版分段震动", () => {
  const game = eventGame(false);
  const shakes = [];
  game.presentation = {
    shakeStepped(stageMs, stages, initialSpanSourcePx) {
      shakes.push({ stageMs, stages, initialSpanSourcePx });
    },
  };

  game.publishWorldEvents([
    { type: "speed-impact", entityId: 1 },
    {
      type: "forced-movement-impact",
      entityId: 2,
      data: { mechanism: "flight-landing" },
    },
    { type: "crumbly-rock-smashed", entityId: 3 },
  ]);

  assert.deepEqual(shakes, [
    { stageMs: 26, stages: 8, initialSpanSourcePx: 42 },
    { stageMs: 26, stages: 8, initialSpanSourcePx: 42 },
    { stageMs: 26, stages: 8, initialSpanSourcePx: 42 },
  ]);
});
