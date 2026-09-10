import assert from "node:assert/strict";
import test from "node:test";
import { Game } from "../dist/core/Game.js";

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
  game.worldEventListeners = new Set();
  game.interactionRequestListeners = new Set();
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
