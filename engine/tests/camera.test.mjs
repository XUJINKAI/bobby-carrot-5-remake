import test from "node:test";
import assert from "node:assert/strict";
import { Camera } from "../dist/render/Camera.js";

const frame = (nowMs, deltaMs = 0, index = 0) => ({
  frame: index,
  nowMs,
  deltaMs,
});

test("camera applies initial zoom and limits before rendering", () => {
  const camera = new Camera(48, {
    zoom: 1.25,
    minZoom: 0.8,
    maxZoom: 1.5,
  });

  assert.equal(camera.zoom, 1.25);
  camera.setZoom(0.5);
  assert.equal(camera.zoom, 0.8);
  camera.setZoom(2);
  assert.equal(camera.zoom, 1.5);
});

test("camera keeps stable defaults when options are omitted or invalid", () => {
  const defaults = new Camera();
  assert.equal(defaults.zoom, 1);
  defaults.setZoom(0);
  assert.equal(defaults.zoom, 0.3);
  defaults.setZoom(3);
  assert.equal(defaults.zoom, 2.75);

  const invalid = new Camera(48, {
    zoom: Number.NaN,
    minZoom: Number.NaN,
    maxZoom: Number.NaN,
  });
  assert.equal(invalid.zoom, 1);
  invalid.setZoom(0);
  assert.equal(invalid.zoom, 0.3);
  invalid.setZoom(3);
  assert.equal(invalid.zoom, 2.75);
});

test("camera shake offsets presentation briefly then returns exactly to baseline", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 4, y: 3 }, 20, 20);
  const baseline = camera.worldToScreen(4, 3);

  camera.shake(frame(100), 150, 6);
  camera.update(frame(125, 25, 1));
  const shaken = camera.worldToScreen(4, 3);
  assert.equal(camera.shaking, true);
  assert.notDeepEqual(shaken, baseline);

  camera.update(frame(250, 125, 2));
  assert.equal(camera.shaking, false);
  assert.deepEqual(camera.worldToScreen(4, 3), baseline);
});

test("screenToTile compensates the current shake offset", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 4, y: 3 }, 20, 20);
  camera.shake(frame(100), 150, 6);
  camera.update(frame(125, 25, 1));

  const screen = camera.worldToScreen(4.25, 3.25);
  assert.deepEqual(camera.screenToTile(screen.x, screen.y), { x: 4, y: 3 });
});

test("resetShake removes the effect without changing camera follow position", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 4, y: 3 }, 20, 20);
  const baseline = camera.worldToScreen(4, 3);

  camera.shake(frame(100), 150, 6);
  camera.update(frame(125, 25, 1));
  assert.notDeepEqual(camera.worldToScreen(4, 3), baseline);
  camera.resetShake();

  assert.equal(camera.shaking, false);
  assert.deepEqual(camera.worldToScreen(4, 3), baseline);
});
