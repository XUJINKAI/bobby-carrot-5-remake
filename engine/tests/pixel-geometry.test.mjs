import test from "node:test";
import assert from "node:assert/strict";
import { snapRectToDevicePixels } from "../dist/render/CanvasPixelGeometry.js";

test("pixel-snapped adjacent cells share the same boundary", () => {
  const deviceScale = 1.25;
  const first = snapRectToDevicePixels(0, 0, 38, 38, deviceScale);
  const second = snapRectToDevicePixels(38, 0, 76, 38, deviceScale);

  assert.equal(first.x + first.width, second.x);
  assert.equal(Math.round(first.width * deviceScale), 48);
  assert.equal(Math.round(second.width * deviceScale), 47);
});
