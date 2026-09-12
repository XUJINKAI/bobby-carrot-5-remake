import test from "node:test";
import assert from "node:assert/strict";
import { Renderer } from "../dist/render/Renderer.js";
import { Camera } from "../dist/render/Camera.js";
import { drawVisualComposition } from "../dist/render/VisualPainter.js";

function fixture() {
  const draws = [];
  const context = {
    setTransform() {},
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage(...args) {
      draws.push(args);
    },
  };
  const images = {
    atlasId: "atlas",
    sourceTileSize: 48,
    image() {
      return { width: 192, height: 96 };
    },
  };
  return { draws, context, images };
}

const atlas = { kind: "atlas", column: 0, row: 0 };
const viewport = { x: 0, y: 0, width: 96, height: 96 };

test("40×40 地图只提交视口内图块，平移和插值位置使用同一绘制边界", () => {
  const { draws, context, images } = fixture();
  const renderer = new Renderer({ getContext: () => context }, images);
  const camera = new Camera();
  camera.setViewport(96, 96);
  const world = Array.from({ length: 1600 }, (_, index) => ({
    composition: { layers: [atlas] },
    visualX: index % 40,
    visualY: Math.floor(index / 40),
  }));
  const scene = {
    worldWidth: 40,
    worldHeight: 40,
    world,
    player: [],
    effect: [],
    callouts: [],
  };
  for (const center of [1, 20]) {
    camera.centerX = center;
    camera.centerY = center;
    draws.length = 0;
    renderer.render(scene, camera, viewport);
    assert.equal(draws.length, 4);
  }
  scene.world = [];
  scene.player = [{
    presence: { cell: { x: 0, y: 0 } },
    composition: { layers: [atlas] },
    visualX: 18.5,
    visualY: 19,
  }];
  draws.length = 0;
  renderer.render(scene, camera, viewport);
  assert.equal(draws.length, 1);
});

test("大图、偏移和帧尺寸按实际像素范围裁剪，Canvas 回调保留执行", () => {
  const { draws, context, images } = fixture();
  function paint(layers, left, top = 0, tileSize = 48, deviceScale = 1) {
    draws.length = 0;
    drawVisualComposition(context, images, { layers }, left, top, tileSize, deviceScale, viewport);
    return draws.length;
  }
  const sprite = { kind: "image", asset: "sprite" };
  assert.equal(paint([atlas, sprite], 96), 1);
  assert.equal(paint([sprite], 200), 0);
  assert.equal(paint([{ ...sprite, offsetX: -120 }], 200), 1);
  assert.equal(paint([{ ...sprite, anchor: "fill" }], 96), 0);
  assert.equal(paint([{ ...sprite, frameColumns: 4, frameRows: 2 }], 96), 0);
  assert.equal(paint([{ ...sprite, frameColumns: 2, anchor: "center" }], 96), 1);
  assert.equal(paint([sprite], 0, 120), 1);
  assert.equal(paint([sprite], 0, 200), 0);
  assert.equal(paint([atlas], -48), 0);
  assert.equal(paint([atlas], -47.5, 0, 48, 2), 1);
  // 非整数缩放产生不同的像素对齐宽高，旋转后仍可能露出视口。
  assert.equal(paint([{ ...atlas, rotate: 1 }], -48.25, 0, 48.25, 2), 1);
  let callbacks = 0;
  paint([{
    kind: "canvas",
    draw() {
      callbacks += 1;
    },
  }], 1000);
  assert.equal(callbacks, 1);
});
