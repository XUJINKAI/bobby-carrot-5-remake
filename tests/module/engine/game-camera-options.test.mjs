import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../../../engine/dist/public.js";

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

test("Game 重开时恢复关卡起点镜头并保留缩放", async () => {
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
    getBoundingClientRect: () => ({ width: 480, height: 288 }),
    addEventListener() {},
    removeEventListener() {},
  };
  const game = new Game({
    canvas,
    images: { sourceTileSize: 48, preload: async () => {} },
  });

  try {
    await game.loadLevel({
      schemaVersion: 1,
      width: 20,
      height: 1,
      entities: [
        ...Array.from({ length: 20 }, (_, x) => ({
          type: "grass",
          variant: "ts-10-1",
          x,
          y: 0,
        })),
        { type: "bobby", x: 10, y: 0 },
      ],
    });
    const camera = game.presentation.visual.camera;
    const startX = camera.centerX;
    game.setZoom(1.5);
    game.panByScreen(150, 0);
    assert.equal(camera.hasPanOffset, true);
    assert.notEqual(camera.centerX, startX);

    game.restart();
    assert.equal(camera.hasPanOffset, false);
    assert.equal(camera.centerX, startX);
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
