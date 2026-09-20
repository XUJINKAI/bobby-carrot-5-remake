import test from "node:test";
import assert from "node:assert/strict";
import {
  Camera,
  CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP,
  CAMERA_FOLLOW_STEP_MS,
  cameraFollowTravelDurationMs,
} from "../../../engine/dist/render/Camera.js";

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
  assert.equal(defaults.zoom, 0.25);
  defaults.setZoom(5);
  assert.equal(defaults.zoom, 4);

  const invalid = new Camera(48, {
    zoom: Number.NaN,
    minZoom: Number.NaN,
    maxZoom: Number.NaN,
  });
  assert.equal(invalid.zoom, 1);
  invalid.setZoom(0);
  assert.equal(invalid.zoom, 0.25);
  invalid.setZoom(5);
  assert.equal(invalid.zoom, 4);
});

test("multi-target framing can zoom below the configured limit", () => {
  const camera = new Camera(48, { zoom: 1, minZoom: 0.8, maxZoom: 2 });
  camera.setViewport(240, 144);
  camera.followPoints([{ x: 0, y: 1 }, { x: 19, y: 1 }], 20, 3);

  assert.ok(camera.zoom < 0.8);
  assert.ok(camera.worldToScreen(0, 1).x >= 0);
  assert.ok(camera.worldToScreen(20, 2).x <= 240);

  camera.follow({ x: 1, y: 1 }, 20, 3);
  assert.equal(camera.zoom, 1);
});

test("camera initially keeps the map against the viewport boundary", () => {
  const camera = new Camera(48, { panBounds: "map-edge" });
  camera.setViewport(480, 288);

  camera.follow({ x: 1, y: 1 }, 20, 20);

  assert.deepEqual(camera.worldToScreen(0, 0), { x: 0, y: 0 });
});

test("camera zoom keeps the selected screen point anchored", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 10, y: 10 }, 30, 30);
  const anchor = camera.worldToScreen(8.25, 9.75);

  camera.setZoomAt(2, anchor.x, anchor.y);
  camera.follow({ x: 10, y: 10 }, 30, 30);

  const after = camera.worldToScreen(8.25, 9.75);
  assert.ok(Math.abs(after.x - anchor.x) < 0.0001);
  assert.ok(Math.abs(after.y - anchor.y) < 0.0001);
});

test("camera pan allows each map edge to reach the viewport center", () => {
  const camera = new Camera(48, { panBounds: "map-edge" });
  camera.setViewport(480, 320);
  camera.follow({ x: 10, y: 10 }, 20, 20);

  camera.panByScreen(10_000, 10_000);
  camera.follow({ x: 10, y: 10 }, 20, 20);
  assert.deepEqual(camera.worldToScreen(0, 0), { x: 240, y: 160 });

  camera.panByScreen(-10_000, -10_000);
  camera.follow({ x: 10, y: 10 }, 20, 20);
  assert.deepEqual(camera.worldToScreen(20, 20), { x: 240, y: 160 });
});

test("viewport pan bounds keep map edges against the viewport", () => {
  const camera = new Camera(48, { panBounds: "viewport" });
  camera.setViewport(480, 288);
  camera.follow({ x: 10, y: 10 }, 20, 20);

  camera.panByScreen(10_000, 10_000);
  camera.follow({ x: 10, y: 10 }, 20, 20);
  assert.deepEqual(camera.worldToScreen(0, 0), { x: 0, y: 0 });

  camera.panByScreen(-10_000, -10_000);
  camera.follow({ x: 10, y: 10 }, 20, 20);
  assert.deepEqual(camera.worldToScreen(20, 20), { x: 480, y: 288 });
});

test("camera uses the configured global acceleration curve for discontinuous targets", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 10, y: 10 }, 40, 40, frame(0));
  const from = { x: camera.centerX, y: camera.centerY };
  const travelSteps = cameraFollowTravelDurationMs(10 * 48, 0) /
    CAMERA_FOLLOW_STEP_MS;

  camera.follow({ x: 20, y: 10 }, 40, 40, frame(100));
  assert.deepEqual({ x: camera.centerX, y: camera.centerY }, from);

  camera.follow(
    { x: 20, y: 10 },
    40,
    40,
    frame(100 + CAMERA_FOLLOW_STEP_MS),
  );
  assert.equal(
    camera.centerX,
    from.x + CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP / 48,
  );
  assert.equal(camera.centerY, from.y);

  camera.follow(
    { x: 20, y: 10 },
    40,
    40,
    frame(100 + (travelSteps - 1) * CAMERA_FOLLOW_STEP_MS),
  );
  assert.ok(camera.centerX > from.x && camera.centerX < 20.5);

  camera.follow(
    { x: 20, y: 10 },
    40,
    40,
    frame(100 + travelSteps * CAMERA_FOLLOW_STEP_MS),
  );
  assert.deepEqual(
    { x: camera.centerX, y: camera.centerY },
    { x: 20.5, y: 10.5 },
  );
});

test("camera applies one proportional progress to both axes", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 10, y: 10 }, 40, 40, frame(0));
  const from = { x: camera.centerX, y: camera.centerY };
  const target = { x: 20.5, y: 15.5 };
  const travelSteps = cameraFollowTravelDurationMs(10 * 48, 5 * 48) /
    CAMERA_FOLLOW_STEP_MS;

  camera.follow({ x: 20, y: 15 }, 40, 40, frame(100));
  camera.follow(
    { x: 20, y: 15 },
    40,
    40,
    frame(100 + 10 * CAMERA_FOLLOW_STEP_MS),
  );

  const xProgress = (camera.centerX - from.x) / (target.x - from.x);
  const yProgress = (camera.centerY - from.y) / (target.y - from.y);
  assert.ok(Math.abs(xProgress - yProgress) < 1e-10);
  assert.ok(xProgress > 0 && xProgress < 1);

  camera.follow(
    { x: 20, y: 15 },
    40,
    40,
    frame(100 + travelSteps * CAMERA_FOLLOW_STEP_MS),
  );
  assert.deepEqual(
    { x: camera.centerX, y: camera.centerY },
    target,
  );
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

test("原版 impact shake 按毫秒阶段离散衰减", () => {
  const camera = new Camera(48);
  camera.setViewport(480, 320);
  camera.follow({ x: 4, y: 3 }, 20, 20);
  const baseline = camera.worldToScreen(4, 3);

  camera.shakeStepped(frame(100), 26, 8, 42);
  camera.update(frame(100, 0, 1));
  const firstStage = camera.worldToScreen(4, 3);
  assert.notDeepEqual(firstStage, baseline);

  camera.update(frame(125, 25, 2));
  assert.deepEqual(camera.worldToScreen(4, 3), firstStage);
  camera.update(frame(126, 1, 3));
  assert.notDeepEqual(camera.worldToScreen(4, 3), firstStage);

  camera.update(frame(282, 156, 4));
  assert.equal(camera.shaking, true);
  assert.deepEqual(camera.worldToScreen(4, 3), baseline);
  camera.update(frame(308, 26, 5));
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
