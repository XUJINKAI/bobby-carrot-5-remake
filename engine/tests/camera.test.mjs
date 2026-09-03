import test from "node:test";
import assert from "node:assert/strict";
import { Camera } from "../dist/render/Camera.js";

const frame = (nowMs, deltaMs = 0, index = 0) => ({
  frame: index,
  nowMs,
  deltaMs,
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
