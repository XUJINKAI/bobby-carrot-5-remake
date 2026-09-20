import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../../../engine/dist/public.js";

test("Game 销毁时保留宿主持有的音频播放状态", async (t) => {
  const previousWindow = globalThis.window;
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  t.after(() => {
    restoreGlobal("window", previousWindow);
    restoreGlobal("requestAnimationFrame", previousRequestAnimationFrame);
    restoreGlobal("cancelAnimationFrame", previousCancelAnimationFrame);
  });

  const musicCalls = [];
  const audio = {
    playMusic(id) {
      musicCalls.push(id);
    },
    stopMusic() {
      musicCalls.push(null);
    },
  };
  const canvas = {
    getContext: () => null,
    getBoundingClientRect: () => ({ width: 96, height: 48 }),
    addEventListener() {},
    removeEventListener() {},
  };
  const game = new Game({
    canvas,
    images: { sourceTileSize: 48, preload: async () => {} },
    audio,
  });

  await game.loadLevel({
    schemaVersion: 1,
    width: 2,
    height: 1,
    music: "title",
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: "bobby", x: 0, y: 0 },
    ],
  });
  game.destroy();

  assert.deepEqual(musicCalls, ["title"]);
});

function restoreGlobal(name, value) {
  if (value === undefined) delete globalThis[name];
  else globalThis[name] = value;
}
