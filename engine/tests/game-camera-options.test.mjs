import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/public.js";

test("Game 在首次渲染前应用 runtime Camera 配置", () => {
  const previousWindow = globalThis.window;
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};

  const canvas = {
    getContext: () => null,
    addEventListener() {},
    removeEventListener() {},
  };
  const game = new Game({
    canvas,
    images: { sourceTileSize: 48 },
    runtime: {
      camera: {
        zoom: 1.25,
        minZoom: 0.8,
        maxZoom: 1.5,
      },
    },
  });

  try {
    assert.equal(game.zoom, 1.25);
    game.setZoom(0.5);
    assert.equal(game.zoom, 0.8);
    game.setZoom(2);
    assert.equal(game.zoom, 1.5);
  } finally {
    game.destroy();
    restoreGlobal("window", previousWindow);
    restoreGlobal("requestAnimationFrame", previousRequestAnimationFrame);
    restoreGlobal("cancelAnimationFrame", previousCancelAnimationFrame);
  }
});

function restoreGlobal(name, value) {
  if (value === undefined) delete globalThis[name];
  else globalThis[name] = value;
}
