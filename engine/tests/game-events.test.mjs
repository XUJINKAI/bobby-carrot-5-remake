import assert from "node:assert/strict";
import test from "node:test";
import { Game } from "../dist/core/Game.js";
import { WorldEventDispatcher } from "../dist/core/WorldEventDispatcher.js";

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

function eventGame(replayPlaying, hasPendingChoices = false) {
  const game = Object.create(Game.prototype);
  game.replayPlayback = { playing: replayPlaying, hasPendingChoices };
  game.worldEvents = new WorldEventDispatcher();
  game.visual = { camera: { shake() {} } };
  game.presentationClock = { current: {} };
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

test("没有 choices 的 Replay playback 只发布可观察的世界事件", () => {
  const game = eventGame(true);
  const worldEvents = [];
  const requests = [];
  game.onWorldEvent((event) => worldEvents.push(event));
  game.onInteractionRequest((event) => requests.push(event));

  game.publishWorldEvents([interaction]);

  assert.deepEqual(worldEvents, [interaction]);
  assert.deepEqual(requests, []);
});

test("Replay frame 声明 choices 时重新请求外部交互", () => {
  const game = eventGame(true, true);
  const requests = [];
  game.onInteractionRequest((event) => requests.push(event));

  game.publishWorldEvents([interaction]);

  assert.deepEqual(requests, [interaction]);
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
