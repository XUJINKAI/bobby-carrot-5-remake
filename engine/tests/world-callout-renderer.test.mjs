import test from "node:test";
import assert from "node:assert/strict";
import { Camera } from "../dist/render/Camera.js";
import { drawWorldCallout } from "../dist/render/WorldCalloutRenderer.js";

function fixture() {
  const imageDraws = [];
  const textDraws = [];
  const fills = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    save() {},
    restore() {},
    measureText(text) {
      return { width: text.length * 7 };
    },
    drawImage(...args) {
      imageDraws.push(args);
    },
    fillRect(...args) {
      fills.push(args);
    },
    fillText(...args) {
      textDraws.push(args);
    },
  };
  const slice = {
    source: "hud-atlas",
    x: 179,
    y: 0,
    width: 37,
    height: 38,
  };
  const images = {
    sourceTileSize: 48,
    sliceDefinition(id) {
      assert.equal(id, "hud-shovel");
      return slice;
    },
    slice(id) {
      assert.equal(id, "hud-shovel");
      return { ...slice, image: { id: "hud-atlas" } };
    },
  };
  const camera = new Camera(48, { zoom: 1 });
  camera.setViewport(240, 240);
  camera.centerX = 2.5;
  camera.centerY = 2.5;
  return { camera, context, fills, imageDraws, images, textDraws };
}

const viewport = { x: 0, y: 0, width: 240, height: 240 };

test("图片 Callout 锚定世界位置并使用语义图片切片", () => {
  const { camera, context, imageDraws, images } = fixture();
  drawWorldCallout(
    context,
    images,
    {
      channel: "missing-item:1",
      x: 2.5,
      y: 2,
      content: {
        type: "image-slice",
        sliceId: "hud-shovel",
        accessibleText: "需要雪铲",
      },
      placement: "above",
      clearanceSourcePx: 36,
    },
    camera,
    viewport,
  );

  assert.equal(imageDraws.length, 1);
  assert.deepEqual(imageDraws[0].slice(1, 5), [179, 0, 37, 38]);
  assert.equal(imageDraws[0][5], 102);
  assert.equal(imageDraws[0][6], 21);
});

test("auto-vertical 在 Canvas 顶部空间不足时显示到锚点下方", () => {
  const { camera, context, imageDraws, images } = fixture();
  camera.centerY = 3.25;
  drawWorldCallout(
    context,
    images,
    {
      channel: "missing-item:1",
      x: 2.5,
      y: 2,
      content: {
        type: "image-slice",
        sliceId: "hud-shovel",
        accessibleText: "需要雪铲",
      },
      placement: "auto-vertical",
      clearanceSourcePx: 36,
    },
    camera,
    viewport,
  );

  assert.equal(imageDraws.length, 1);
  assert.ok(imageDraws[0][6] > camera.worldToScreen(2.5, 2).y);
});

test("文字 Callout 支持多行 Canvas 排版", () => {
  const { camera, context, fills, images, textDraws } = fixture();
  drawWorldCallout(
    context,
    images,
    {
      channel: "npc:1",
      x: 2.5,
      y: 2,
      content: { type: "text", text: "Bobby\nCarrot" },
      placement: "above",
      clearanceSourcePx: 0,
    },
    camera,
    viewport,
  );

  assert.equal(fills.length, 1);
  assert.deepEqual(textDraws.map((draw) => draw[0]), ["Bobby", "Carrot"]);
});

test("屏幕外锚点不吸附到 Canvas 边缘", () => {
  const { camera, context, imageDraws, images } = fixture();
  drawWorldCallout(
    context,
    images,
    {
      channel: "missing-item:1",
      x: 20,
      y: 20,
      content: {
        type: "image-slice",
        sliceId: "hud-shovel",
        accessibleText: "需要雪铲",
      },
      placement: "auto-vertical",
      clearanceSourcePx: 36,
    },
    camera,
    viewport,
  );
  assert.equal(imageDraws.length, 0);
});
